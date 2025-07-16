import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, IconButton, Menu, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUser, updateUser } from '../api/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'UserForm'>;

const UserFormScreen: React.FC<Props> = ({ navigation, route }) => {
    const user = route.params?.user;
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        cpfCnpj: user?.cpfCnpj || '',
        type: user?.type || '',
        profile: user?.profile || '',
    });
    const [visibleType, setVisibleType] = useState(false);
    const [visibleProfile, setVisibleProfile] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name) newErrors.name = 'Nome é obrigatório';
        if (!formData.email) newErrors.email = 'Email é obrigatório';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido';
        if (!formData.cpfCnpj) newErrors.cpfCnpj = 'CPF/CNPJ é obrigatório';
        else if (!/^\d{11}$|^\d{14}$/.test(formData.cpfCnpj)) newErrors.cpfCnpj = 'CPF/CNPJ inválido';
        if (!formData.type) newErrors.type = 'Tipo é obrigatório';
        if (!formData.profile) newErrors.profile = 'Perfil é obrigatório';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        try {
            const data = {
                name: formData.name,
                email: formData.email,
                cpfCnpj: formData.cpfCnpj,
                type: formData.type,
                profile: formData.profile,
            };
            if (user) {
                await updateUser(user.id, data);
            } else {
                await createUser(data);
            }
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Erro', error.message || `Falha ao ${user ? 'atualizar' : 'criar'} usuário`);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }} edges={['top', 'bottom', 'left', 'right']}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>Usuário</Text>
            </View>
            <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 }}>
                <TextInput
                    label="Nome"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    style={{ height: 30, marginVertical: 5 }}
                    error={!!errors.name}
                />
                {errors.name && <Text style={{ color: 'red', fontSize: 12 }}>{errors.name}</Text>}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <TextInput
                            label="Email"
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                            keyboardType="email-address"
                            style={{ height: 30, marginVertical: 5 }}
                            error={!!errors.email}
                        />
                        {errors.email && <Text style={{ color: 'red', fontSize: 12 }}>{errors.email}</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                        <TextInput
                            label="CPF/CNPJ"
                            value={formData.cpfCnpj}
                            onChangeText={(text) => setFormData({ ...formData, cpfCnpj: text })}
                            keyboardType="numeric"
                            style={{ height: 30, marginVertical: 5 }}
                            error={!!errors.cpfCnpj}
                        />
                        {errors.cpfCnpj && <Text style={{ color: 'red', fontSize: 12 }}>{errors.cpfCnpj}</Text>}
                    </View>
                </View>

                <Menu
                    visible={visibleType}
                    onDismiss={() => setVisibleType(false)}
                    anchor={
                        <Button onPress={() => setVisibleType(true)} mode="outlined" style={{ marginVertical: 5 }}>
                            {formData.type === 'individual' ? 'Individual' : formData.type === 'company' ? 'Empresa' : 'Selecionar tipo'}
                        </Button>
                    }
                    style={{ maxWidth: 300 }}
                >
                    <Menu.Item onPress={() => { setFormData({ ...formData, type: '' }); setVisibleType(false); }} title="Limpar seleção" />
                    <Menu.Item onPress={() => { setFormData({ ...formData, type: 'individual' }); setVisibleType(false); }} title="Individual" />
                    <Menu.Item onPress={() => { setFormData({ ...formData, type: 'company' }); setVisibleType(false); }} title="Empresa" />
                </Menu>
                {errors.type && <Text style={{ color: 'red', fontSize: 12 }}>{errors.type}</Text>}

                <Menu
                    visible={visibleProfile}
                    onDismiss={() => setVisibleProfile(false)}
                    anchor={
                        <Button onPress={() => setVisibleProfile(true)} mode="outlined" style={{ marginVertical: 5 }}>
                            {formData.profile === 'user' ? 'Usuário' : formData.profile === 'admin' ? 'Administrador' : 'Selecionar perfil'}
                        </Button>
                    }
                    style={{ maxWidth: 300 }}
                >
                    <Menu.Item onPress={() => { setFormData({ ...formData, profile: '' }); setVisibleProfile(false); }} title="Limpar seleção" />
                    <Menu.Item onPress={() => { setFormData({ ...formData, profile: 'user' }); setVisibleProfile(false); }} title="Usuário" />
                    <Menu.Item onPress={() => { setFormData({ ...formData, profile: 'admin' }); setVisibleProfile(false); }} title="Administrador" />
                </Menu>
                {errors.profile && <Text style={{ color: 'red', fontSize: 12 }}>{errors.profile}</Text>}

                <Button mode="contained" onPress={handleSubmit} style={{ marginVertical: 10 }}>
                    {user ? 'Atualizar' : 'Criar'}
                </Button>
                <Button onPress={() => navigation.goBack()}>Cancelar</Button>
            </View>
        </SafeAreaView>
    );
};

export default UserFormScreen;