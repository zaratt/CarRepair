import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, View } from 'react-native';
import { Button, IconButton, Menu, Text, TextInput } from 'react-native-paper';
import { createWorkshop, getUsers, updateWorkshop } from '../api/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { User } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkshopForm'>;

const WorkshopFormScreen: React.FC<Props> = ({ navigation, route }) => {
    const workshop = route.params?.workshop;
    const [formData, setFormData] = useState({
        name: workshop?.name || '',
        userId: workshop?.userId || '',
        address: workshop?.address || '',
        phone: workshop?.phone || '',
        subdomain: workshop?.subdomain || '',
    });
    const [users, setUsers] = useState<User[]>([]);
    const [visible, setVisible] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await getUsers();
                setUsers(data);
            } catch (error) {
                Alert.alert('Erro', 'Falha ao carregar usuários');
            }
        };
        fetchUsers();
    }, []);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.userId) newErrors.userId = 'Usuário é obrigatório';
        if (!formData.address) newErrors.address = 'Endereço é obrigatório';
        if (!formData.phone) newErrors.phone = 'Telefone é obrigatório';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        try {
            const data = {
                name: formData.name,
                userId: formData.userId,
                address: formData.address,
                phone: formData.phone,
                subdomain: formData.subdomain || undefined,
            };
            if (workshop) {
                await updateWorkshop(workshop.id, data);
            } else {
                await createWorkshop(data);
            }
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Erro', error.message || `Falha ao ${workshop ? 'atualizar' : 'criar'} oficina`);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>Oficina</Text>
            </View>
            <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 }}>
                <Menu
                    visible={visible}
                    onDismiss={() => setVisible(false)}
                    anchor={
                        <Button onPress={() => setVisible(true)} mode="outlined" style={{ marginVertical: 5 }}>
                            {formData.userId
                                ? users.find((u) => u.id === formData.userId)?.name || 'Selecionar usuário'
                                : 'Selecionar usuário'}
                        </Button>
                    }
                    style={{ maxWidth: 300 }}
                >
                    <Menu.Item onPress={() => { setFormData({ ...formData, userId: '' }); setVisible(false); }} title="Limpar seleção" />
                    {users.map((user) => (
                        <Menu.Item
                            key={user.id}
                            onPress={() => { setFormData({ ...formData, userId: user.id }); setVisible(false); }}
                            title={user.name}
                        />
                    ))}
                </Menu>
                {errors.userId && <Text style={{ color: 'red', fontSize: 12 }}>{errors.userId}</Text>}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <TextInput
                            label="Endereço"
                            value={formData.address}
                            onChangeText={(text) => setFormData({ ...formData, address: text })}
                            style={{ height: 30, marginVertical: 5 }}
                            error={!!errors.address}
                        />
                        {errors.address && <Text style={{ color: 'red', fontSize: 12 }}>{errors.address}</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                        <TextInput
                            label="Telefone"
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            keyboardType="phone-pad"
                            style={{ height: 30, marginVertical: 5 }}
                            error={!!errors.phone}
                        />
                        {errors.phone && <Text style={{ color: 'red', fontSize: 12 }}>{errors.phone}</Text>}
                    </View>
                </View>

                <TextInput
                    label="Subdomínio"
                    value={formData.subdomain}
                    onChangeText={(text) => setFormData({ ...formData, subdomain: text })}
                    style={{ height: 30, marginVertical: 5 }}
                    placeholder="Opcional"
                />

                <Button mode="contained" onPress={handleSubmit} style={{ marginVertical: 10 }}>
                    {workshop ? 'Atualizar' : 'Criar'}
                </Button>
                <Button onPress={() => navigation.goBack()}>Cancelar</Button>
            </View>
        </SafeAreaView>
    );
};

export default WorkshopFormScreen;