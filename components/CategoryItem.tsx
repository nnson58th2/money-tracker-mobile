import React, { memo, useCallback } from 'react';
import { YStack, Text, Circle } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
}

interface CategoryItemProps {
    category: Category;
    isSelected: boolean;
    onToggle: (categoryId: string) => void;
}

/**
 * Memoized category item component for list performance optimization.
 * Uses useCallback internally to prevent re-renders from parent callback changes.
 */
const CategoryItem = memo(function CategoryItem({
    category,
    isSelected,
    onToggle
}: CategoryItemProps) {
    const handlePress = useCallback(() => {
        onToggle(category.id);
    }, [category.id, onToggle]);

    return (
        <YStack
            width="30%"
            alignItems="center"
            gap={8}
            onPress={handlePress}
            pressStyle={{ opacity: 0.7 }}
        >
            <Circle
                size={64}
                backgroundColor={isSelected ? category.color : '$tertiary'}
                borderWidth={isSelected ? 0 : 1}
                borderColor="$borderColor"
            >
                <Ionicons
                    name={category.icon as any}
                    size={28}
                    color={isSelected ? 'white' : category.color}
                />
            </Circle>
            <Text
                color="$color"
                fontSize={12}
                textAlign="center"
                fontWeight={isSelected ? '600' : '400'}
            >
                {category.name}
            </Text>
        </YStack>
    );
});

export default CategoryItem;
