import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import { YStack, XStack, Text, Circle, ScrollView, useTheme, Separator, Image, Switch } from 'tamagui';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

import BlurCard from '@/components/BlurCard';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
    { icon: 'person-outline', label: 'Thông tin cá nhân', value: '' },
    { icon: 'notifications-outline', label: 'Thông báo', value: 'Bật' },
    { icon: 'card-outline', label: 'Quản lý thẻ', value: '2 thẻ' },
    { icon: 'shield-checkmark-outline', label: 'Bảo mật & Quyền riêng tư', value: '' },
    { icon: 'help-circle-outline', label: 'Trợ giúp & Hỗ trợ', value: '' },
];

export default function ProfileScreen() {
    const theme = useTheme();
    const {
        isFaceIdEnabled,
        isBiometricAvailable,
        biometricType,
        enableFaceId,
        disableFaceId,
    } = useAuth();
    const [isTogglingFaceId, setIsTogglingFaceId] = useState(false);

    const isVerifiedAccount = true;

    const biometricLabel = biometricType === 'face' ? 'Face ID' :
                           biometricType === 'fingerprint' ? 'Touch ID' : 'Sinh trắc học';

    const handleToggleFaceId = async (enabled: boolean) => {
        if (isTogglingFaceId) return;
        setIsTogglingFaceId(true);

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
                            if (password === '123') {
                                const success = await enableFaceId(password);
                                if (success) {
                                    Alert.alert('Thành công', `${biometricLabel} đã được bật!`);
                                } else {
                                    Alert.alert('Lỗi', `Không thể bật ${biometricLabel}.`);
                                }
                            } else {
                                Alert.alert('Lỗi', 'Mật khẩu không đúng.');
                            }
                            setIsTogglingFaceId(false);
                        },
                    },
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
                        <Circle 
                            size={80} 
                            borderWidth={2} 
                            borderColor="$borderColor" 
                            backgroundColor="$borderColor"
                            marginBottom={8}
                        >
                            <Circle
                                size={76}
                                overflow="hidden"
                                justifyContent="flex-start"
                                alignItems="center"
                            >
                                <Image
                                    source={require('@/assets/images/xoan-avatar.webp')} 
                                    width="100%"
                                    height="100%" 
                                    objectFit="cover"
                                />
                            </Circle>
                        </Circle>
                        <Text color="$color" fontSize={24} fontWeight="700" marginBottom={4}>Nguyễn Như Sơn</Text>
                        <Text color="$color" fontSize={16}>nhuson2306@gmail.com</Text>
                        <XStack 
                            backgroundColor="$primary" 
                            paddingHorizontal={12} 
                            paddingVertical={6} 
                            borderRadius={100} 
                            marginTop={12}
                            borderWidth={1}
                            borderColor="$borderColor"
                        >
                            <Text color={isVerifiedAccount ? "$success" : "$red"} fontSize={12} fontWeight="600">● {isVerifiedAccount ? 'Đã xác thực' : 'Chưa xác thực'}</Text>
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
                                            <Text color="$color" fontSize={16} fontWeight="500">{item.label}</Text>
                                        </XStack>
                                        <XStack alignItems="center" gap={8}>
                                            {item.value ? <Text color="$color" fontSize={14}>{item.value}</Text> : null}
                                            <Ionicons name="chevron-forward" size={20} color={theme.color?.val} />
                                        </XStack>
                                    </XStack>
                                    {index < menuItems.length - 1 && <Separator borderColor="$borderColor" marginHorizontal={20} />}
                                </React.Fragment>
                            ))}
                        </BlurCard>
                    </YStack>

                    {/* Face ID / Biometric Section */}
                    {isBiometricAvailable && (
                        <YStack paddingHorizontal={24} marginBottom={40}>
                            <Text color="$tertiary" fontSize={14} fontWeight="600" marginBottom={12} marginLeft={4}>
                                ĐĂNG NHẬP NHANH
                            </Text>
                            <BlurCard intensity={10} paddingHorizontal={0} paddingVertical={0}>
                                <XStack
                                    padding={20}
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    <XStack alignItems="center" gap={16}>
                                        <Circle size={40} backgroundColor="$tertiary">
                                            <MaterialCommunityIcons
                                                name={biometricType === 'fingerprint' ? 'fingerprint' : 'face-recognition'}
                                                size={22}
                                                color={theme.colorBox?.val}
                                            />
                                        </Circle>
                                        <YStack>
                                            <Text color="$color" fontSize={16} fontWeight="500">
                                                Đăng nhập bằng {biometricLabel}
                                            </Text>
                                            <Text color="$tertiary" fontSize={12}>
                                                {isFaceIdEnabled ? 'Đã bật' : 'Chưa bật'}
                                            </Text>
                                        </YStack>
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
                            </BlurCard>
                        </YStack>
                    )}
                </ScrollView>
            </SafeAreaView>
        </YStack>
    );
}
