import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Button, Card, Chip, IconButton, Searchbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFavoriteWorkshops, getWorkshops } from '../api/api';
import FloatingBottomTabs from '../components/FloatingBottomTabs';
import { Workshop } from '../types';

const quickFilters = [
    { key: 'local', label: 'Na minha localidade', icon: 'map-marker' },
    { key: 'motor', label: 'Motor', icon: 'engine' },
    { key: 'cambio', label: 'Câmbio', icon: 'car-shift-pattern' },
    { key: 'escapamento', label: 'Escapamento', icon: 'car-cog' },
    { key: 'acessorios', label: 'Acessórios', icon: 'car-wrench' },
    { key: 'favoritos', label: 'Favoritas', icon: 'star' },
];

const AvailableWorkshopsScreen = ({ navigation, route }: any) => {
    const [search, setSearch] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<string>('');
    const [workshops, setWorkshops] = useState<Workshop[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [userId, setUserId] = useState<string>('');
    const [profile, setProfile] = useState<string>('car_owner');

    useEffect(() => {
        // Buscar userId e profile do AsyncStorage
        const fetchData = async () => {
            const userStr = await AsyncStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            setUserId(user?.id || '');
            setProfile(user?.profile || 'car_owner');
            const all = await getWorkshops();
            setWorkshops(all);
            const favs = await getFavoriteWorkshops(user?.id || '');
            setFavorites(favs.map((w) => w.id));
        };
        fetchData();
    }, []);

    const filtered = workshops.filter((w) => {
        if (selectedFilter === 'favoritos') return favorites.includes(w.id);
        if (search) return w.name.toLowerCase().includes(search.toLowerCase());
        return true;
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }} edges={["top", "left", "right"]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>Oficinas Disponíveis</Text>
            </View>
            <Searchbar
                placeholder="Buscar oficina, localidade ou serviço"
                value={search}
                onChangeText={setSearch}
                style={{ margin: 12, marginBottom: 0 }}
            />
            <FlatList
                data={quickFilters}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.key}
                style={{ marginVertical: 8, marginLeft: 8, maxHeight: 44 }}
                contentContainerStyle={{ alignItems: 'center', paddingRight: 12 }}
                renderItem={({ item }) => (
                    <Chip
                        icon={item.icon}
                        selected={selectedFilter === item.key}
                        onPress={() => setSelectedFilter(item.key)}
                        style={{ marginRight: 8, borderRadius: 20, height: 36 }}
                        compact
                    >
                        {item.label}
                    </Chip>
                )}
            />
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Card style={{ margin: 10 }}>
                        <Card.Content>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text variant="titleMedium">{item.name}</Text>
                                    {favorites.includes(item.id) && <IconButton icon="star" iconColor="#FFD600" size={20} />}
                                </View>
                                <Button
                                    mode="outlined"
                                    onPress={() => navigation.navigate('WorkshopDetail', { workshopId: item.id })}
                                    style={{ borderRadius: 8, minWidth: 90, height: 36, marginLeft: 8 }}
                                    labelStyle={{ fontSize: 13 }}
                                    contentStyle={{ height: 36 }}
                                >
                                    Ver Detalhes
                                </Button>
                            </View>
                            <Text>{item.address}</Text>
                            <Text>Serviços: {/* TODO: listar serviços */}</Text>
                            <Text>Rating: {item.rating ? item.rating.toFixed(1) : 'N/A'}</Text>
                        </Card.Content>
                    </Card>
                )}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>Nenhuma oficina encontrada.</Text>}
            />
            {profile && <FloatingBottomTabs profile={profile} />}
        </SafeAreaView>
    );
};

export default AvailableWorkshopsScreen;
