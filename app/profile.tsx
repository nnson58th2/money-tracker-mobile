import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, ScrollView, Separator, Switch, Text, useTheme, XStack, YStack } from 'tamagui';

import BlurCard from '@/components/BlurCard';
import { useAuth } from '@/context/AuthContext';
import { getBiometricLabel } from '@/utils/formatting';

const menuItems = [
    { icon: 'person-outline', label: 'Thông tin cá nhân', value: '' },
    { icon: 'notifications-outline', label: 'Thông báo', value: 'Bật' },
    { icon: 'card-outline', label: 'Quản lý thẻ', value: '2 thẻ' },
    { icon: 'shield-checkmark-outline', label: 'Bảo mật & Quyền riêng tư', value: '' },
    { icon: 'help-circle-outline', label: 'Trợ giúp & Hỗ trợ', value: '' }
];

export default function ProfileScreen() {
    const theme = useTheme();
    const { isFaceIdEnabled, isBiometricAvailable, biometricType, enableFaceId, disableFaceId, user, logout, clearRememberedUser } = useAuth();
    const [isTogglingFaceId, setIsTogglingFaceId] = useState(false);

    const isVerifiedAccount = user?.emailVerified ?? false;
    const biometricLabel = getBiometricLabel(biometricType);
    const displayName = user?.displayName || 'Người dùng';
    const displayEmail = user?.email || 'Chưa có email';

    // Handle switch account - clear remembered user and logout
    const handleSwitchAccount = async () => {
        Alert.alert('Đổi tài khoản', 'Bạn có muốn đăng xuất và đổi sang tài khoản khác?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đổi tài khoản',
                style: 'destructive',
                onPress: async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    await clearRememberedUser();
                    await logout();
                    router.replace('/login');
                }
            }
        ]);
    };

    const handleToggleFaceId = async (enabled: boolean) => {
        if (isTogglingFaceId) return;
        setIsTogglingFaceId(true);

        // Haptic feedback for toggle interaction
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (enabled) {
            // Need to prompt for password to enable Face ID
            Alert.prompt(
                `Bật ${biometricLabel}`,
                'Nhập mật khẩu để kích hoạt:',
                [
                    { text: 'Hủy', style: 'cancel', onPress: () => setIsTogglingFaceId(false) },
                    {
                        text: 'Xác nhận',
                        onPress: async (password?: string) => {
                            if (password) {
                                const success = await enableFaceId(password);
                                if (success) {
                                    Alert.alert('Thành công', `${biometricLabel} đã được bật!`);
                                } else {
                                    Alert.alert('Lỗi', 'Mật khẩu không đúng hoặc không thể bật sinh trắc học.');
                                }
                            }
                            setIsTogglingFaceId(false);
                        }
                    }
                ],
                'secure-text'
            );
        } else {
            await disableFaceId();
            Alert.alert('Thành công', `${biometricLabel} đã được tắt.`);
            setIsTogglingFaceId(false);
        }
    };

    return (
        <YStack flex={1} backgroundColor="$primary">
            <Stack.Screen options={{ title: 'Hồ sơ', headerBackTitle: 'Trang chủ', headerTintColor: theme.color?.val }} />
            <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <YStack alignItems="center" marginTop={20} marginBottom={32}>
                        <Circle size={80} borderWidth={2} borderColor="$borderColor" backgroundColor="$borderColor" marginBottom={8}>
                            <Circle size={76} overflow="hidden" justifyContent="flex-start" alignItems="center">
                                <Image
                                    source={require('@/assets/images/xoan-avatar.webp')}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                    transition={200}
                                    cachePolicy="memory-disk"
                                />
                            </Circle>
                        </Circle>
                        <Text color="$color" fontSize={24} fontWeight="700" marginBottom={4}>
                            {displayName}
                        </Text>
                        <Text color="$color" fontSize={16}>
                            {displayEmail}
                        </Text>
                        <XStack
                            backgroundColor="$primary"
                            paddingHorizontal={12}
                            paddingVertical={6}
                            borderRadius={100}
                            marginTop={12}
                            borderWidth={1}
                            borderColor="$borderColor"
                        >
                            <Text color={isVerifiedAccount ? '$success' : '$red'} fontSize={12} fontWeight="600">
                                ● {isVerifiedAccount ? 'Đã xác thực' : 'Chưa xác thực'}
                            </Text>
                        </XStack>
                    </YStack>

                    <YStack paddingHorizontal={24} marginBottom={24}>
                        <BlurCard intensity={10} paddingHorizontal={0} paddingVertical={0}>
                            {menuItems.map((item, index) => (
                                <React.Fragment key={item.label}>
                                    <XStack
                                        padding={20}
                                        alignItems="center"
                                        justifyContent="space-between"
                                        pressStyle={{ backgroundColor: '$backgroundHover' }}
                                    >
                                        <XStack alignItems="center" gap={16}>
                                            <Circle size={40} backgroundColor="$tertiary">
                                                <Ionicons name={item.icon as any} size={20} color={theme.colorBox?.val} />
                                            </Circle>
                                            <Text color="$color" fontSize={16} fontWeight="500">
                                                {item.label}
                                            </Text>
                                        </XStack>
                                        <XStack alignItems="center" gap={8}>
                                            {item.value ? (
                                                <Text color="$color" fontSize={14}>
                                                    {item.value}
                                                </Text>
                                            ) : null}
                                            <Ionicons name="chevron-forward" size={20} color={theme.color?.val} />
                                        </XStack>
                                    </XStack>
                                    {index < menuItems.length - 1 && <Separator borderColor="$borderColor" marginHorizontal={20} />}
                                </React.Fragment>
                            ))}
                        </BlurCard>
                    </YStack>

                    <YStack paddingHorizontal={24} marginBottom={24} gap={12}>
                        <BlurCard intensity={10} paddingHorizontal={0} paddingVertical={0}>
                            {/* Biometric */}
                            {isBiometricAvailable && (
                                <XStack padding={20} alignItems="center" justifyContent="space-between">
                                    <XStack alignItems="center" gap={16}>
                                        <Circle size={40} backgroundColor="$tertiary">
                                            <MaterialCommunityIcons
                                                name={biometricType === 'fingerprint' ? 'fingerprint' : 'face-recognition'}
                                                size={22}
                                                color={theme.colorBox?.val}
                                            />
                                        </Circle>
                                        <Text color="$color" fontSize={16} fontWeight="500">
                                            Đăng nhập nhanh
                                        </Text>
                                    </XStack>
                                    <Switch
                                        size="$4"
                                        checked={isFaceIdEnabled}
                                        onCheckedChange={handleToggleFaceId}
                                        disabled={isTogglingFaceId}
                                        backgroundColor={isFaceIdEnabled ? '$success' : '$secondary'}
                                    >
                                        <Switch.Thumb backgroundColor="$color" />
                                    </Switch>
                                </XStack>
                            )}
                            <Separator borderColor="$borderColor" marginHorizontal={20} />

                            {/* Switch Account */}
                            <XStack
                                padding={20}
                                alignItems="center"
                                justifyContent="space-between"
                                pressStyle={{ backgroundColor: '$backgroundHover' }}
                                onPress={handleSwitchAccount}
                            >
                                <XStack alignItems="center" gap={16}>
                                    <Circle size={40} backgroundColor="$red">
                                        <Ionicons name="swap-horizontal-outline" size={20} color={theme.colorBox?.val} />
                                    </Circle>
                                    <Text color="$color" fontSize={16} fontWeight="500">
                                        Đổi tài khoản khác
                                    </Text>
                                </XStack>
                                <Ionicons name="chevron-forward" size={20} color={theme.color?.val} />
                            </XStack>
                        </BlurCard>
                    </YStack>
                </ScrollView>
            </SafeAreaView>
        </YStack>
    );
}
