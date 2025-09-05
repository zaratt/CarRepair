import React, { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { AppColors } from '../styles/colors';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            onFinish();
        }, 2000); // 2 segundos

        return () => clearTimeout(timer);
    }, [onFinish]);

    if (!isVisible) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Image
                source={require('../../assets/splash-icon.png')}
                style={styles.logo}
                resizeMode="contain"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.primary, // #F7C910
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
        zIndex: 9999,
    },
    logo: {
        width: 250, // Aumentei o tamanho do logo
        height: 250,
    },
});
