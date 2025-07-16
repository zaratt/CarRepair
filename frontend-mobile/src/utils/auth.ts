import AsyncStorage from '@react-native-async-storage/async-storage';

export const getStoredUser = async () => {
    const userStr = await AsyncStorage.getItem('user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};

export const clearUser = async () => {
    await AsyncStorage.removeItem('user');
};
