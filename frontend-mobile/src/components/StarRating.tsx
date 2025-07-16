import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface StarRatingProps {
    rating: number;
    onChange?: (rating: number) => void;
    size?: number;
    disabled?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onChange, size = 28, disabled = false }) => {
    return (
        <View style={{ flexDirection: 'row' }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                    key={star}
                    onPress={() => onChange && !disabled && onChange(star)}
                    disabled={disabled}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={size}
                        color={star <= rating ? '#FFD700' : '#CCC'}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
};

export default StarRating;
