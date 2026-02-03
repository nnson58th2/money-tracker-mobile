import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, View, useTheme } from 'tamagui';
import BlurCard from '@/components/BlurCard';

export default function AnalyticsScreen() {
    const theme = useTheme();

    return (
        <YStack flex={1} backgroundColor="$background">
            <SafeAreaView edges={['top']} style={styles.header}>
                <Text color="$color" fontSize={32} fontWeight="700">Thống kê</Text>
            </SafeAreaView>
             
            <YStack padding={24} paddingTop={0}>
                <BlurCard intensity={20} marginBottom={20}>
                    <Text color="$color" fontSize={18} fontWeight="600" marginBottom={16}>
                        Tổng quan chi tiêu
                    </Text>
                    <YStack 
                        height={150} 
                        justifyContent="center" 
                        alignItems="center"
                        borderWidth={1}
                        borderColor="$borderColor"
                        borderStyle="dashed"
                        borderRadius={12}
                    >
                        <Text color="$muted">Biểu đồ mẫu</Text>
                    </YStack>
                </BlurCard>

                <BlurCard intensity={20}>
                    <Text color="$color" fontSize={18} fontWeight="600" marginBottom={16}>
                        Ngân sách tháng
                    </Text>
                    <Text color="$primary" fontSize={24} fontWeight="700" marginBottom={8}>
                        Còn lại 31,250,000 ₫
                    </Text>
                    <YStack 
                        height={8} 
                        borderRadius={4} 
                        width="100%" 
                        backgroundColor="$surface"
                        overflow="hidden"
                    > 
                        <View 
                            height="100%" 
                            width="60%" 
                            backgroundColor="$secondary" 
                            borderRadius={4} 
                        />
                    </YStack>
                </BlurCard>
            </YStack>
        </YStack>
    );
}

const styles = StyleSheet.create({
    header: {
        padding: 24,
    },
});
