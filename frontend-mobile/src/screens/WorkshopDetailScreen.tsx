import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
// Usar Chip do react-native-paper
import { Rating } from '@kolking/react-native-rating';
import { ActivityIndicator, Button, Card, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { favoriteWorkshop, getFavoriteWorkshops, getWorkshopRatings, getWorkshops, rateWorkshop, unfavoriteWorkshop } from '../api/api';
import { User, Workshop } from '../types';
import { getStoredUser } from '../utils/auth';

interface Props {
    route: { params: { workshopId: string } };
    navigation: any;
}

const WorkshopDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const { workshopId } = route.params;
    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [userRating, setUserRating] = useState<number>(0);
    const [userReview, setUserReview] = useState<string>('');
    const [loadingRating, setLoadingRating] = useState(false);
    const [ratings, setRatings] = useState<any[]>([]);
    const [isFavorite, setIsFavorite] = useState(false);
    // Novos estados para modal de avaliação
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [pendingRating, setPendingRating] = useState(0);
    // Chips de feedback estruturado
    const FEEDBACK_OPTIONS = [
        'Orçamento dentro do esperado',
        'Prazo',
        'Clareza dos Serviços',
        'Limpeza',
        'Atendimento',
        'Contato',
        'Peças',
    ];
    const [pendingReview, setPendingReview] = useState<string[]>([]); // agora array de strings
    const [ratingSent, setRatingSent] = useState(false);

    const loadScreenData = useCallback(async () => {
        setLoading(true);
        try {
            const storedUser = await getStoredUser();
            setUser(storedUser);

            const [workshopData, ratingsData, favsData] = await Promise.all([
                getWorkshops(),
                getWorkshopRatings(workshopId),
                storedUser ? getFavoriteWorkshops(storedUser.id ?? (storedUser as any).userId) : Promise.resolve([]),
            ]);

            const currentWorkshop = workshopData.find((w) => w.id === workshopId) || null;
            setWorkshop(currentWorkshop);
            setRatings(ratingsData);

            if (storedUser) {
                // Corrigir para aceitar tanto id quanto userId
                const myId = storedUser.id ?? (storedUser as any).userId;
                const foundRating = ratingsData.find((r: any) => r.userId === myId);
                setUserRating(foundRating?.value || 0);
                setIsFavorite(favsData.some((w) => w.id === workshopId));
            }
        } catch (error) {
            Alert.alert("Erro", "Não foi possível carregar os dados da oficina.");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [workshopId, navigation]);

    useFocusEffect(
        useCallback(() => {
            loadScreenData();
            setPendingRating(1); // inicia o rating pendente em 1 para garantir 5 estrelas
            setPendingReview([]);
            setShowRatingModal(false);
            setRatingSent(false);
        }, [loadScreenData])
    );

    // LOGS de debug removidos

    // Função para salvar avaliação via modal
    const handleSaveRating = async () => {
        if (!user || !(user.id ?? (user as any).userId)) {
            Alert.alert('Atenção', 'Você precisa estar logado para avaliar a oficina.');
            return;
        }
        if (pendingRating === 0) {
            Alert.alert('Atenção', 'Por favor, selecione uma nota.');
            return;
        }
        setLoadingRating(true);
        try {
            // Envia array de chips diretamente
            await rateWorkshop(workshopId, (user.id ?? (user as any).userId), pendingRating, pendingReview);
            setShowRatingModal(false);
            setRatingSent(true);
            setPendingRating(0);
            setPendingReview([]);
            await loadScreenData();
            Alert.alert('Sucesso', 'Avaliação enviada com sucesso!');
        } catch (e) {
            Alert.alert('Erro', 'Falha ao enviar avaliação. Verifique sua conexão.');
        } finally {
            setLoadingRating(false);
        }
    };

    const handleFavorite = async () => {
        if (!user || !(user.id ?? (user as any).userId)) return;
        try {
            const myId = user.id ?? (user as any).userId;
            if (isFavorite) {
                setIsFavorite(false); // feedback imediato
                await unfavoriteWorkshop(workshopId, myId);
            } else {
                setIsFavorite(true); // feedback imediato
                await favoriteWorkshop(workshopId, myId);
            }
            // Atualiza favoritos e avaliações após operação
            await loadScreenData();
        } catch (error) {
            Alert.alert("Erro", "Não foi possível atualizar os favoritos.");
        }
    };

    if (loading || !workshop) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
            {/* Modal de avaliação */}
            <Portal>
                <Modal visible={showRatingModal} onDismiss={() => setShowRatingModal(false)} contentContainerStyle={{ backgroundColor: '#fff', margin: 24, borderRadius: 12, padding: 20 }}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Avalie esta oficina:</Text>
                    <Rating
                        rating={pendingRating}
                        scale={2}
                        size={32}
                        onChange={setPendingRating}
                        fillColor="#ff9900ff"
                        style={{ marginVertical: 8, alignSelf: 'center', minWidth: 176 }}
                        disabled={loadingRating}
                    />
                    <Text style={{ marginTop: 12, marginBottom: 4, fontWeight: 'bold' }}>Como foi o serviço?</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        {FEEDBACK_OPTIONS.map(option => (
                            <Chip
                                key={option}
                                mode={pendingReview.includes(option) ? 'flat' : 'outlined'}
                                selected={pendingReview.includes(option)}
                                onPress={() => {
                                    setPendingReview(prev =>
                                        prev.includes(option)
                                            ? prev.filter(o => o !== option)
                                            : [...prev, option]
                                    );
                                }}
                                style={{ marginRight: 6, marginBottom: 6, backgroundColor: pendingReview.includes(option) ? '#1976d2' : undefined }}
                                textStyle={{ color: pendingReview.includes(option) ? '#fff' : '#333', fontSize: 13 }}
                            >
                                {option}
                            </Chip>
                        ))}
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                        <Button onPress={() => setShowRatingModal(false)} disabled={loadingRating} style={{ marginRight: 8 }}>
                            Cancelar
                        </Button>
                        <Button
                            mode="contained"
                            loading={loadingRating}
                            disabled={loadingRating || pendingRating === 0}
                            onPress={handleSaveRating}
                        >
                            Salvar
                        </Button>
                    </View>
                </Modal>
            </Portal>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>Detalhes da Oficina</Text>
            </View>
            <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 }}>
                <Card style={{ marginBottom: 16 }}>
                    {/* Estrela de favorito no topo direito */}
                    <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                        <IconButton
                            icon={isFavorite ? 'star' : 'star-outline'}
                            size={28}
                            onPress={handleFavorite}
                            iconColor={isFavorite ? '#FFD700' : '#888'}
                            style={{ backgroundColor: 'transparent' }}
                            disabled={!user}
                        />
                    </View>
                    <Card.Content>
                        <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 4 }}>{workshop.name}</Text>
                        <Text>Endereço: {workshop.address}</Text>
                        <Text>Proprietário: {workshop.user?.name || 'N/A'}</Text>
                        <Text>Telefone: {workshop.phone}</Text>
                        <View style={{ marginTop: 12, marginBottom: 4 }}>
                            {/* Botão Avaliar para car_owner que ainda não avaliou */}
                            {(user && (user.id ?? (user as any).userId) && user.profile === 'car_owner' && userRating === 0) && (
                                <Button
                                    mode="contained"
                                    onPress={() => setShowRatingModal(true)}
                                    disabled={ratingSent}
                                    style={{ marginBottom: 12, alignSelf: 'flex-start' }}
                                >
                                    Avaliar
                                </Button>
                            )}
                            <Text style={{ marginTop: 4, color: '#888' }}>
                                Média: {workshop.rating ? workshop.rating.toFixed(1) : 'N/A'} / 5 ({ratings.length} avaliações)
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                            <Button
                                mode={isFavorite ? 'contained' : 'outlined'}
                                icon={isFavorite ? 'star' : 'star-outline'}
                                onPress={handleFavorite}
                                disabled={!user}
                                style={{ borderRadius: 8, minWidth: 160, height: 38 }}
                                labelStyle={{ fontSize: 14 }}
                                contentStyle={{ height: 36 }}
                            >
                                {isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                            </Button>
                        </View>
                    </Card.Content>
                </Card>
                <Card style={{ marginBottom: 16 }}>
                    <Card.Title title="Avaliações dos usuários" />
                    <Card.Content>
                        {ratings.length === 0 ? (
                            <Text>Nenhuma avaliação ainda.</Text>
                        ) : (
                            ratings.map((r, idx) => (
                                <View key={r.id || idx} style={{ marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 }}>
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>{r.user?.name || 'Usuário'}</Text>
                                    <Rating
                                        rating={r.value}
                                        scale={5}
                                        size={18}
                                        disabled
                                        fillColor="#FFD700"
                                        style={{ alignSelf: 'flex-start', marginVertical: 2 }}
                                    />
                                    {/* Exibe chips do review, se houver */}
                                    {Array.isArray(r.review) && r.review.length > 0 && (
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
                                            {r.review.map((chip: string, i: number) => (
                                                <Chip
                                                    key={chip + i}
                                                    mode="flat"
                                                    style={{ marginRight: 4, marginBottom: 4, backgroundColor: '#1976d2' }}
                                                    textStyle={{ color: '#fff', fontSize: 12 }}
                                                    disabled
                                                >
                                                    {chip.trim()}
                                                </Chip>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            ))
                        )}
                    </Card.Content>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
};

export default WorkshopDetailScreen;