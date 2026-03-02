import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ImageBackground, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, ScrollView, Text, useTheme, XStack, YStack } from 'tamagui';

import BlurCard from '@/components/BlurCard';
import TransactionItem from '@/components/TransactionItem';
import { useAuth } from '@/context/AuthContext';
import { getVietnameseGreeting } from '@/utils/helpers';

const actions = [
    { icon: 'arrow-down-right', label: 'Thu nhập' },
    { icon: 'arrow-up-right', label: 'Chi tiêu' },
    { icon: 'grid', label: 'Khám phá' }
];

const transactionList = [
    {
        icon: 'tv-outline',
        title: 'Đăng ký Netflix',
        category: 'Giải trí',
        amount: '300,000 ₫'
    },
    {
        icon: 'cart',
        title: 'Siêu thị GO!',
        category: 'Mua sắm',
        amount: '1,900,000 ₫'
    },
    {
        icon: 'server',
        title: 'Dịch vụ AWS',
        category: 'Hạ tầng',
        amount: '520,000 ₫'
    },
    {
        icon: 'home-sharp',
        title: 'Nhà',
        category: 'Cố định',
        amount: '3,500,000 ₫'
    },
    {
        icon: 'cash',
        title: 'Lương',
        category: 'Thu nhập',
        amount: '9,500,000 ₫',
        isExpense: false
    },
    {
        icon: 'cafe',
        title: 'Katinat Coffee',
        category: 'Ăn uống',
        amount: '65,000 ₫'
    }
];

export default function HomeScreen() {
    const theme = useTheme();
    const router = useRouter();
    const [showBalance, setShowBalance] = useState(false);
    const notificationCount = 12;
    const { logout } = useAuth();

    // Stable callback references to prevent unnecessary re-renders
    const handleAction = useCallback(
        (label: string) => {
            if (label === 'Thu nhập') router.push('/income');
            if (label === 'Chi tiêu') router.push('/spending');
        },
        [router]
    );

    const handleLogout = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        logout();
        router.replace('/login');
    }, [logout, router]);

    const handleToggleBalance = useCallback(() => {
        setShowBalance((prev) => !prev);
    }, []);

    const handleNotifications = useCallback(() => {
        router.push('/notifications');
    }, [router]);

    const handleProfile = useCallback(() => {
        router.push('/profile');
    }, [router]);

    return (
        <ImageBackground source={require('@/assets/images/main-bg.webp')} style={{ flex: 1 }} resizeMode="cover">
            <YStack flex={1} backgroundColor="$background">
                <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
                    <SafeAreaView edges={['top']} style={styles.header}>
                        <YStack>
                            <Text color="$muted" fontSize={14} marginBottom={4}>
                                {getVietnameseGreeting()}! 👋
                            </Text>
                            <Text color="$color" fontSize={24} fontWeight="700">
                                Nguyễn Như Sơn
                            </Text>
                        </YStack>
                        <XStack gap={25}>
                            <XStack position="relative" pressStyle={{ opacity: 0.7 }} onPress={handleNotifications}>
                                <Ionicons name="notifications-outline" size={24} color={theme.color?.val} />
                                {notificationCount > 0 && (
                                    <YStack
                                        position="absolute"
                                        top={-9}
                                        right={-9}
                                        backgroundColor="red"
                                        borderRadius={100}
                                        minWidth={20}
                                        height={20}
                                        alignItems="center"
                                        justifyContent="center"
                                        paddingHorizontal={5}
                                    >
                                        <Text color="white" fontSize={10} fontWeight="700">
                                            {notificationCount > 9 ? '9+' : notificationCount}
                                        </Text>
                                    </YStack>
                                )}
                            </XStack>
                            <XStack pressStyle={{ opacity: 0.7 }} onPress={handleProfile}>
                                <Ionicons name="person" size={24} color={theme.color?.val} />
                            </XStack>
                            <XStack pressStyle={{ opacity: 0.7 }} onPress={handleLogout}>
                                <Ionicons name="log-out-outline" size={24} color={theme.color?.val} />
                            </XStack>
                        </XStack>
                    </SafeAreaView>

                    <YStack paddingHorizontal={24} marginBottom={24}>
                        <YStack style={styles.cardShadowContainer}>
                            <LinearGradient
                                colors={['#5E4F39', '#2D2620', '#14110F']}
                                start={{ x: 1, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={styles.balanceCardGradient}
                            >
                                <XStack justifyContent="space-between" marginBottom={30}>
                                    <YStack>
                                        <XStack alignItems="center" gap={8} marginBottom={8}>
                                            <Text color="$tertiary" fontSize={16} marginEnd={8}>
                                                Số dư hiện tại
                                            </Text>
                                            <Ionicons
                                                name={showBalance ? 'eye-outline' : 'eye-off-outline'}
                                                size={20}
                                                padding={4}
                                                color={theme.tertiary?.val}
                                                onPress={handleToggleBalance}
                                            />
                                        </XStack>
                                        <Text color="white" fontSize={26} fontWeight="800">
                                            {showBalance ? '24,562,000 ₫' : '*******'}
                                        </Text>
                                    </YStack>

                                    <XStack
                                        backgroundColor="rgba(0,0,0,0.2)"
                                        borderRadius={30}
                                        paddingHorizontal={12}
                                        paddingVertical={8}
                                        gap={6}
                                        alignItems="center"
                                        alignSelf="flex-start"
                                        pressStyle={{ opacity: 0.7 }}
                                        onPress={() => router.push('/qr-receive')}
                                    >
                                        <Ionicons name="qr-code-outline" size={20} color="white" />
                                        <Text color="white" fontSize={14} fontWeight="600">
                                            QR
                                        </Text>
                                    </XStack>
                                </XStack>
                            </LinearGradient>
                        </YStack>
                    </YStack>

                    <XStack justifyContent="space-between" paddingHorizontal={24} marginBottom={32}>
                        {actions.map((action, index) => (
                            <YStack
                                key={`${index}-${action.label}`}
                                alignItems="center"
                                pressStyle={{ opacity: 0.7 }}
                                onPress={() => handleAction(action.label)}
                            >
                                <Circle
                                    size={64}
                                    backgroundColor={theme.colorBox?.val}
                                    borderWidth={1}
                                    borderColor={theme.borderColor?.val}
                                    marginBottom={8}
                                >
                                    <Feather name={action.icon as any} size={24} color={theme.color?.val} />
                                </Circle>
                                <Text color="$color" fontSize={14} fontWeight="500">
                                    {action.label}
                                </Text>
                            </YStack>
                        ))}
                    </XStack>

                    <YStack paddingHorizontal={24}>
                        <XStack justifyContent="space-between" alignItems="center" marginBottom={16}>
                            <Text color="$color" fontSize={20} fontWeight="700">
                                Giao dịch gần đây
                            </Text>
                            <Text color="$color" fontSize={14} fontWeight="600" pressStyle={{ opacity: 0.7 }}>
                                Xem tất cả
                            </Text>
                        </XStack>

                        <BlurCard intensity={10}>
                            {transactionList.map((transaction) => (
                                <TransactionItem
                                    key={transaction.title}
                                    icon={transaction.icon as any}
                                    title={transaction.title}
                                    category={transaction.category}
                                    amount={transaction.amount}
                                    isExpense={transaction.isExpense}
                                />
                            ))}
                        </BlurCard>
                    </YStack>
                </ScrollView>
            </YStack>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 24,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12
    },
    cardShadowContainer: {
        borderRadius: 16,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        shadowOffset: {
            width: 4,
            height: 8
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10
    },
    balanceCardGradient: {
        borderRadius: 16,
        padding: 16,
        paddingBottom: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)'
    }
});
