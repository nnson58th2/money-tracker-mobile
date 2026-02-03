import React, { useRef, useState, useEffect } from 'react';
import { TouchableOpacity, Alert, ImageBackground, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Stack, router, Link } from 'expo-router';
import { YStack, XStack, Text, Input, Button, Circle, useTheme, Image } from 'tamagui';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { getBiometricLabel, formatBadgeCount } from '@/utils/formatting';

const MAX_FACE_ID_ATTEMPTS = 3;



export default function LoginScreen() {
    const theme = useTheme();
    const {
        login,
        isFaceIdEnabled,
        isBiometricAvailable,
        biometricType,
        enableFaceId,
        loginWithFaceId,
        checkBiometricStatus
    } = useAuth();
    const passwordRef = useRef<Input>(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [faceIdAttempts, setFaceIdAttempts] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const notificationCount = 100;

    // Check biometric status when screen loads
    useEffect(() => {
        checkBiometricStatus();
    }, [checkBiometricStatus]);

    // Reset Face ID attempts when component mounts
    useEffect(() => {
        setFaceIdAttempts(0);
    }, []);

    const promptEnableFaceId = (enteredPassword: string) => {
        const biometricLabel = getBiometricLabel(biometricType);

        Alert.alert(
            `Bật ${biometricLabel}`,
            `Bạn có muốn sử dụng ${biometricLabel} để đăng nhập nhanh hơn trong lần sau?`,
            [
                {
                    text: 'Không',
                    style: 'cancel',
                },
                {
                    text: 'Bật',
                    onPress: async () => {
                        const success = await enableFaceId(enteredPassword);
                        if (success) {
                            Alert.alert('Thành công', `${biometricLabel} đã được bật!`);
                        } else {
                            Alert.alert('Lỗi', `Không thể bật ${biometricLabel}. Vui lòng thử lại.`);
                        }
                    },
                },
            ]
        );
    };

    const handleLogin = () => {
        const isPasswordFocused = passwordRef.current?.isFocused();
        if (!(passwordRef.current as any)?.value && !isPasswordFocused) {
            passwordRef.current?.focus();
            return;
        }

        const loginRes = login(password);
        if (!loginRes) {
            Alert.alert('Lỗi đăng nhập', 'Mật khẩu không đúng. Vui lòng kiểm tra lại!');
        } else {
            // Login successful - prompt to enable Face ID if available and not already enabled
            if (isBiometricAvailable && !isFaceIdEnabled) {
                promptEnableFaceId(password);
            }
        }
    };

    const handleFaceIdLogin = async () => {
        if (isLoading) return;

        // If Face ID is not enabled yet, prompt user to login with password first
        if (!isFaceIdEnabled) {
            Alert.alert(
                'Chưa kích hoạt',
                'Vui lòng đăng nhập bằng mật khẩu trước để kích hoạt Face ID.',
                [{ text: 'OK', onPress: () => passwordRef.current?.focus() }]
            );
            return;
        }

        setIsLoading(true);
        const result = await loginWithFaceId();
        setIsLoading(false);

        if (!result.success) {
            const newAttempts = faceIdAttempts + 1;
            setFaceIdAttempts(newAttempts);

            if (newAttempts >= MAX_FACE_ID_ATTEMPTS) {
                // Max attempts reached - show password input
                Alert.alert(
                    'Xác thực thất bại',
                    'Bạn đã thử quá nhiều lần. Vui lòng đăng nhập bằng mật khẩu.',
                    [{ text: 'OK', onPress: () => passwordRef.current?.focus() }]
                );
                setFaceIdAttempts(0); // Reset for next time
            } else {
                // Show retry option with remaining attempts
                const remainingAttempts = MAX_FACE_ID_ATTEMPTS - newAttempts;
                Alert.alert(
                    'Xác thực thất bại',
                    `${result.error || 'Vui lòng thử lại'}\n\nCòn ${remainingAttempts} lần thử.`,
                    [
                        { text: 'Thử lại', onPress: handleFaceIdLogin },
                        { text: 'Hủy', style: 'cancel' },
                    ]
                );
            }
        }
        // If successful, auth context will navigate automatically
    };

    // Determine if Face ID button should be shown
    // Show button if biometric available AND (Face ID enabled OR for first-time setup)
    const showFaceIdButton = isBiometricAvailable && faceIdAttempts < MAX_FACE_ID_ATTEMPTS;

    return (
        <YStack flex={1}>
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* Background elements to mimic depth if needed, but keeping clean for now */}
            <ImageBackground 
                source={require('@/assets/images/main-bg.webp')}
                style={{ flex: 1 }}
                resizeMode="cover"
            >
                <YStack flex={1} backgroundColor="$background">
                    <SafeAreaView style={{ flex: 1 }}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <YStack flex={1} justifyContent="space-between">
                                
                                {/* Top Section: Branding */}
                                <XStack justifyContent="space-between" alignItems="center" marginTop={20} paddingHorizontal={24}>
                                    <XStack alignItems="center" gap={8}>
                                        <Text color="$color" fontSize={24} fontWeight="800" letterSpacing={1}>
                                            <Text color="$success" fontSize={28}>SS</Text> Money Tracker
                                        </Text>
                                    </XStack>
                                </XStack>

                                {/* Middle Section: User & Login */}
                                <YStack gap={20} alignItems="center" paddingHorizontal={24} marginTop={150}>
                                    
                                    {/* Avatar & Welcome */}
                                    <XStack alignItems="center" gap={16}>
                                        <Circle size={60} borderWidth={2} borderColor="$borderColor" backgroundColor="$borderColor" padding={2}>
                                            <Circle size={56} overflow="hidden" justifyContent="flex-start" alignItems="center">
                                                <Image 
                                                    source={require('@/assets/images/xoan-avatar.webp')} 
                                                    width="100%"
                                                    height="100%"
                                                    objectFit="cover"
                                                />
                                            </Circle>
                                        </Circle>
                                        <Text color="$tertiary" fontSize={16}>Xin chào, <Text color="$color" fontWeight="700">Nguyễn Như Sơn</Text></Text>
                                    </XStack>

                                    {/* Login Form */}
                                    <YStack width="100%" gap={16}>
                                        {/* Password Input */}
                                        <XStack 
                                            height={56} 
                                            borderRadius={16} 
                                            alignItems="center" 
                                            paddingHorizontal={16}
                                            borderWidth={1}
                                            borderColor="$borderColor"
                                            backgroundColor="$secondary" 
                                        >
                                            <Ionicons name="lock-closed-outline" size={20} color={theme.color?.val} />
                                            <Input
                                                ref={passwordRef}
                                                flex={1}
                                                backgroundColor="transparent"
                                                borderWidth={0}
                                                placeholder="Mật khẩu"
                                                placeholderTextColor="$tertiary"
                                                secureTextEntry={!showPassword}
                                                value={password}
                                                onChangeText={setPassword}
                                                color="$color"
                                                fontSize={16}
                                            />
                                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={theme.color?.val} />
                                            </TouchableOpacity>
                                        </XStack>

                                        {/* Buttons */}
                                        <XStack gap={12}>
                                            <Button
                                                flex={1}
                                                backgroundColor="$tertiary"
                                                height={56}
                                                borderRadius={16}
                                                pressStyle={{ opacity: 0.8 }}
                                                onPress={handleLogin}
                                            >
                                                <Text color="$colorBox" fontSize={16} fontWeight="700">Đăng nhập</Text>
                                            </Button>
                                            {showFaceIdButton && (
                                                <Button
                                                    width={56}
                                                    height={56}
                                                    backgroundColor="$secondary"
                                                    borderRadius={16}
                                                    borderWidth={1}
                                                    borderColor="$borderColor"
                                                    pressStyle={{ opacity: 0.8 }}
                                                    padding={4}
                                                    opacity={isLoading ? 0.5 : 1}
                                                    disabled={isLoading}
                                                    onPress={handleFaceIdLogin}
                                                    icon={<MaterialCommunityIcons
                                                        name={biometricType === 'fingerprint' ? 'fingerprint' : 'face-recognition'}
                                                        size={30}
                                                        color={theme.tertiary?.val}
                                                    />}
                                                />
                                            )}
                                        </XStack>

                                        <Link href="/register" asChild>
                                            <Text color="$color" fontSize={14} opacity={0.8}>
                                                Quên mật khẩu?
                                            </Text>
                                        </Link>
                                    </YStack>
                                </YStack>

                                {/* Bottom Section: Quick Actions */}
                                <YStack marginBottom={8} gap={20}>
                                    {/* Quick Shortcuts */}
                                    <XStack justifyContent="space-around" paddingHorizontal={24}>
                                        <QuickAction icon="notifications-outline" label="Thông báo" badge={notificationCount} onPress={() => router.push('/notifications')} />
                                        <QuickAction icon="qr-code-outline" label="QR nhận tiền" onPress={() => router.push('/qr-receive')} />
                                    </XStack>

                                    {/* Footer Nav Links */}
                                    <XStack
                                        justifyContent="space-between"
                                        paddingTop={20}
                                        paddingHorizontal={48}
                                        borderTopWidth={1}
                                        borderTopColor="$borderColor"
                                    >
                                        <FooterAction icon="gift-outline" label="Ưu đãi" hasBadge />
                                        <YStack pressStyle={{ opacity: 0.4 }} onPress={() => router.push('/register')}>
                                            <YStack alignItems="center" gap={4}>
                                                <Ionicons name="person-add-outline" size={24} color={theme.color?.val} />
                                                <Text color="$color" fontSize={11}>Đăng ký</Text>
                                            </YStack>
                                        </YStack>
                                        <FooterAction icon="book-outline" label="Hướng dẫn" />
                                    </XStack>
                                </YStack>

                            </YStack>
                        </TouchableWithoutFeedback>
                    </SafeAreaView>
                </YStack>
            </ImageBackground>
        </YStack>
    );
}

function QuickAction({ icon, label, badge, onPress }: { icon: any, label: string, badge?: number, onPress?: () => void }) {
    const theme = useTheme();
    const badgeText = badge ? formatBadgeCount(badge) : '';

    return (
        <YStack alignItems="center" gap={8} opacity={0.9} pressStyle={{ opacity: 0.6 }} onPress={onPress}>
            <YStack>
                <Circle size={56} backgroundColor="$colorBox" borderWidth={1} borderColor="$borderColor">
                    <Ionicons name={icon} size={24} color={theme.color?.val} />
                </Circle>
                {badge && badge > 0 && (
                    <Circle
                        position="absolute"
                        top={-4}
                        right={-4}
                        size={22}
                        backgroundColor="$red"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Text color="white" fontSize={badge > 99 ? 8 : 10} fontWeight="bold">{badgeText}</Text>
                    </Circle>
                )}
            </YStack>
            <Text color="$color" fontSize={12} fontWeight="500">{label}</Text>
        </YStack>
    );
}

function FooterAction({ icon, label, hasBadge }: { icon: any, label: string, hasBadge?: boolean }) {
    const theme = useTheme();
    return (
        <YStack alignItems="center" gap={4} opacity={0.7} pressStyle={{ opacity: 0.4 }}>
            <YStack>
                <Ionicons name={icon} size={24} color={theme.color?.val} />
                {hasBadge && <Circle position="absolute" top={0} right={0} size={8} backgroundColor="red" />}
            </YStack>
            <Text color="$color" fontSize={11} width={60} textAlign="center">{label}</Text>
        </YStack>
    );
}
