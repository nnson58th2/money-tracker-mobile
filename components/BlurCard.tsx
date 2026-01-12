import React from 'react';
import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { YStack } from 'tamagui';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface BlurCardProps {
    children: React.ReactNode;
    intensity?: number;
    paddingHorizontal?: number;
    paddingVertical?: number;
    marginBottom?: number;
}

export default function BlurCard({ children, intensity = 30, paddingHorizontal = 16, paddingVertical = 6, marginBottom = 0 }: BlurCardProps) {
    const colorScheme = useColorScheme() ?? 'light';

    return (
        <YStack
            borderRadius={16}
            overflow="hidden"
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor={colorScheme === 'light' ? '$tertiary' : '$colorBox'}
            marginBottom={marginBottom}
            position="relative"
        >
            <BlurView 
                intensity={intensity} 
                tint={colorScheme === 'dark' ? 'dark' : 'light'} 
                style={StyleSheet.absoluteFill} 
            />
            <YStack paddingHorizontal={paddingHorizontal} paddingVertical={paddingVertical} zIndex={1}>
                {children}
            </YStack>
        </YStack>
    );
}
