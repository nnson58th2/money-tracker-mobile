import React from 'react';
import { XStack, YStack, Text, Circle, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

interface TransactionItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    category: string;
    amount: string;
    isExpense?: boolean;
}

export default function TransactionItem({ icon, title, category, amount, isExpense = true }: TransactionItemProps) {
    const theme = useTheme();

    return (
        <XStack alignItems="center" paddingVertical={12}>
            <Circle 
                size={40} 
                backgroundColor="$tertiary"
                marginRight={16}
            >
                <Ionicons name={icon} size={20} color={theme.colorBox?.val} />
            </Circle>
            <YStack flex={1}>
                <Text color="$color" fontSize={16} fontWeight="600" marginBottom={4}>
                    {title}
                </Text>
                <Text color="$muted" fontSize={14}>
                    {category}
                </Text>
            </YStack>
            <Text 
                color={isExpense ? '$color' : '$success'} 
                fontSize={16} 
                fontWeight="700"
            >
                {isExpense ? '-' : '+'} {amount}
            </Text>
        </XStack>
    );
}
