import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ImageBackground, Keyboard, Pressable, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Circle, Input, Spinner, Text, XStack, YStack, useTheme } from 'tamagui';

import { BiometricScanOverlay, LockoutCountdown } from '@/components/BiometricScanOverlay';
import { SecurityWarningBanner } from '@/components/SecurityWarningBanner';
import { useAuth } from '@/context/AuthContext';
import { formatLockoutTime } from '@/services/biometricAuth';
import { formatBadgeCount, getDisplayNameWithFallback, maskIdentifier } from '@/utils/formatting';

export default function LoginScreen() {
    const theme = useTheme();
    const {
        login,
        isFaceIdEnabled,
        isBiometricAvailable,
        biometricType,
        loginWithFaceId,
        checkBiometricStatus,
        checkLockoutStatus,
        clearLockout,
        lockoutStatus,
        isLoading: authLoading,
        authError,
        clearError,
        user,
        rememberedUser,
        isReturningUser,
        clearRememberedUser
    } = useAuth();
    const identifierRef = useRef<Input>(null);
    const passwordRef = useRef<Input>(null);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [forceFreshLogin, setForceFreshLogin] = useState(false);
    const [integrityWarning, setIntegrityWarning] = useState<string | null>(null);
    const [showSecurityBanner, setShowSecurityBanner] = useState(true);

    const notificationCount = 100;

    // Computed lockout state
    const isLockedOut = lockoutStatus?.isLockedOut ?? false;
    const lockoutTimeMs = lockoutStatus?.remainingTimeMs ?? 0;

    // Detect identifier type (email or phone)
    const identifierType = identifier.includes('@') ? 'email' : /^\d+$/.test(identifier) && identifier.length >= 9 ? 'phone' : null;

    // Determine if we should show returning user UI
    const showReturningUserUI = isReturningUser && !forceFreshLogin && rememberedUser;

    // Get display name for welcome message (use remembered user or current user)
    const displayName = showReturningUserUI
        ? getDisplayNameWithFallback(rememberedUser?.displayName, rememberedUser?.identifier, rememberedUser?.identifierType)
        : user?.displayName || 'Bạn';

    // Get masked identifier for returning users
    const maskedIdentifier = showReturningUserUI && rememberedUser ? maskIdentifier(rememberedUser.identifier, rememberedUser.identifierType) : null;

    // Check biometric status when screen loads
    useEffect(() => {
        checkBiometricStatus();
    }, [checkBiometricStatus]);

    // Reset state when component mounts
    useEffect(() => {
        setIntegrityWarning(null);
        clearError();
    }, [clearError]);

    const handleLogin = async () => {
        // Determine which identifier to use
        const loginIdentifier = showReturningUserUI && rememberedUser ? rememberedUser.identifier : identifier.trim();

        // Validate identifier (only for fresh login)
        if (!showReturningUserUI) {
            if (!identifier.trim()) {
                Alert.alert('Lỗi', 'Vui lòng nhập email hoặc số điện thoại');
                identifierRef.current?.focus();
                return;
            }

            // Validate identifier type
            if (!identifierType) {
                Alert.alert('Lỗi', 'Vui lòng nhập email hoặc số điện thoại hợp lệ');
                return;
            }
        }

        // Validate password
        if (!password.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu');
            passwordRef.current?.focus();
            return;
        }

        setIsLoading(true);
        clearError();

        const loginSuccess = await login(loginIdentifier, password);

        if (loginSuccess) {
            // Login successful - clear any lockout
            await clearLockout();
            setIntegrityWarning(null);
        } else {
            // Error is displayed via authError state
            if (authError) {
                Alert.alert('Đăng nhập thất bại', authError);
            }
        }

        setIsLoading(false);
    };

    const handleFaceIdLogin = async (isAutoTrigger = false) => {
        if (isLoading || isLockedOut) return;

        // If Face ID is not enabled yet, prompt user to login with password first
        if (!isFaceIdEnabled && !isAutoTrigger) {
            Alert.alert('Chưa kích hoạt', 'Vui lòng đăng nhập bằng mật khẩu trước để kích hoạt Face ID.', [
                { text: 'OK', onPress: () => identifierRef.current?.focus() }
            ]);
            return;
        }

        setIsLoading(true);
        const result = await loginWithFaceId();
        setIsLoading(false);

        if (!result.success) {
            // Check for integrity error (biometric data changed)
            if (result.integrityError) {
                setIntegrityWarning(result.integrityError);
                Alert.alert('Cảnh báo bảo mật', `${result.integrityError}\n\n${result.error}`, [
                    { text: 'OK', onPress: () => identifierRef.current?.focus() }
                ]);
                return;
            }

            // Show error with appropriate message
            Alert.alert('Xác thực thất bại', result.error || 'Vui lòng thử lại', [
                ...(isLockedOut ? [] : [{ text: 'Thử lại', onPress: () => handleFaceIdLogin(false) }]),
                { text: 'Dùng mật khẩu', onPress: () => identifierRef.current?.focus() }
            ]);
        }
        // If successful, auth context will navigate automatically
    };

    // Handle forgot password - navigate to dedicated screen
    const handleForgotPassword = () => {
        const params = identifier.trim() ? `?identifier=${encodeURIComponent(identifier.trim())}` : '';
        router.push(`/forgot-password${params}`);
    };

    // Handle lockout timer completion
    const handleLockoutComplete = useCallback(() => {
        checkLockoutStatus();
    }, [checkLockoutStatus]);

    // Handle switch account - clear remembered user and show fresh login
    const handleSwitchAccount = useCallback(async () => {
        setForceFreshLogin(true);
        setIdentifier('');
        setPassword('');
        // Optionally clear from storage too
        await clearRememberedUser();
        setTimeout(() => identifierRef.current?.focus(), 100);
    }, [clearRememberedUser]);

    // Determine if Face ID button should be shown
    const showFaceIdButton = isBiometricAvailable && !isLockedOut;

    // Show animated overlay when scanning or locked out
    const showScanOverlay = (isLoading && isFaceIdEnabled) || isLockedOut;

    return (
        <YStack flex={1}>
            <Stack.Screen options={{ headerShown: false }} />

            <ImageBackground source={require('@/assets/images/main-bg.webp')} style={{ flex: 1 }} resizeMode="cover">
                <YStack flex={1} backgroundColor="$background">
                    <SafeAreaView style={{ flex: 1 }}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <YStack flex={1} justifyContent="space-between">
                                {/* Top Section: Branding */}
                                <YStack>
                                    <XStack justifyContent="space-between" alignItems="center" marginTop={20} paddingHorizontal={24}>
                                        <XStack alignItems="center" gap={8}>
                                            <Text color="$color" fontSize={24} fontWeight="800" letterSpacing={1}>
                                                <Text color="$success" fontSize={28}>
                                                    SS
                                                </Text>{' '}
                                                Money Tracker
                                            </Text>
                                        </XStack>
                                    </XStack>

                                    {/* Security Warning Banner */}
                                    <SecurityWarningBanner visible={showSecurityBanner} onDismiss={() => setShowSecurityBanner(false)} />
                                </YStack>

                                {/* Middle Section: User & Login */}
                                <YStack gap={20} alignItems="center" paddingHorizontal={24}>
                                    {/* Avatar & Welcome */}
                                    <XStack alignItems="center" gap={16}>
                                        <Circle size={60} borderWidth={2} borderColor="$borderColor" backgroundColor="$borderColor" padding={2}>
                                            <Circle size={56} overflow="hidden" justifyContent="flex-start" alignItems="center">
                                                <Image
                                                    source={require('@/assets/images/xoan-avatar.webp')}
                                                    style={{ width: '100%', height: '100%' }}
                                                    contentFit="cover"
                                                    transition={200}
                                                    cachePolicy="memory-disk"
                                                />
                                            </Circle>
                                        </Circle>
                                        <YStack>
                                            <Text color="$tertiary" fontSize={16}>
                                                Xin chào,{' '}
                                                <Text color="$color" fontWeight="700">
                                                    {displayName}
                                                </Text>
                                            </Text>
                                            {integrityWarning && (
                                                <Text color="$red" fontSize={12}>
                                                    {integrityWarning}
                                                </Text>
                                            )}
                                        </YStack>
                                    </XStack>

                                    {/* Animated Biometric Scan Overlay */}
                                    {showScanOverlay && (
                                        <BiometricScanOverlay
                                            isScanning={isLoading}
                                            biometricType={biometricType}
                                            isLockedOut={isLockedOut}
                                            lockoutTimeText={isLockedOut ? formatLockoutTime(lockoutTimeMs) : undefined}
                                        />
                                    )}

                                    {/* Lockout Countdown Timer */}
                                    {isLockedOut && !isLoading && <LockoutCountdown remainingMs={lockoutTimeMs} onComplete={handleLockoutComplete} />}

                                    {/* Login Form - hide when scanning */}
                                    {!showScanOverlay && (
                                        <YStack width="100%" gap={12}>
                                            {/* Email/Phone Input - Show masked for returning users, editable for fresh login */}
                                            {showReturningUserUI ? (
                                                <XStack
                                                    height={56}
                                                    borderRadius={16}
                                                    alignItems="center"
                                                    paddingHorizontal={16}
                                                    borderWidth={1}
                                                    borderColor="$borderColor"
                                                    backgroundColor="$secondary"
                                                    opacity={0.8}
                                                >
                                                    <Ionicons
                                                        name={rememberedUser?.identifierType === 'phone' ? 'call-outline' : 'mail-outline'}
                                                        size={20}
                                                        color={theme.color?.val}
                                                    />
                                                    <Text flex={1} color="$color" fontSize={16} marginLeft={12}>
                                                        {maskedIdentifier}
                                                    </Text>
                                                    <Pressable onPress={handleSwitchAccount}>
                                                        <Text color="$tertiary" fontSize={12}>
                                                            Đổi tài khoản
                                                        </Text>
                                                    </Pressable>
                                                </XStack>
                                            ) : (
                                                <XStack
                                                    height={56}
                                                    borderRadius={16}
                                                    alignItems="center"
                                                    paddingHorizontal={16}
                                                    borderWidth={1}
                                                    borderColor="$borderColor"
                                                    backgroundColor="$secondary"
                                                >
                                                    <Ionicons
                                                        name={identifierType === 'phone' ? 'call-outline' : 'mail-outline'}
                                                        size={20}
                                                        color={theme.color?.val}
                                                    />
                                                    <Input
                                                        ref={identifierRef}
                                                        flex={1}
                                                        backgroundColor="transparent"
                                                        borderWidth={0}
                                                        placeholder="Email hoặc số điện thoại"
                                                        placeholderTextColor="$tertiary"
                                                        value={identifier}
                                                        onChangeText={setIdentifier}
                                                        keyboardType="email-address"
                                                        autoCapitalize="none"
                                                        autoComplete="email"
                                                        color="$color"
                                                        fontSize={16}
                                                    />
                                                    {identifierType && (
                                                        <Text color="$tertiary" fontSize={12}>
                                                            {identifierType === 'email' ? 'Email' : 'SĐT'}
                                                        </Text>
                                                    )}
                                                </XStack>
                                            )}

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
                                                <Pressable
                                                    onPress={() => setShowPassword(!showPassword)}
                                                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                                                >
                                                    <Ionicons
                                                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                                        size={20}
                                                        color={theme.color?.val}
                                                    />
                                                </Pressable>
                                            </XStack>

                                            {/* Auth Error Display */}
                                            {authError && (
                                                <Text color="$red10" textAlign="center" fontSize={13}>
                                                    {authError}
                                                </Text>
                                            )}

                                            {/* Attempt warning */}
                                            {lockoutStatus && lockoutStatus.attempts > 0 && !isLockedOut && (
                                                <Text color="$warning" fontSize={12} textAlign="center">
                                                    {lockoutStatus.attempts} lần thử thất bại
                                                    {lockoutStatus.attempts >= 3 && ' - sắp bị tạm khóa'}
                                                </Text>
                                            )}

                                            {/* Buttons */}
                                            <XStack gap={12}>
                                                <Button
                                                    flex={1}
                                                    backgroundColor="$tertiary"
                                                    height={56}
                                                    borderRadius={16}
                                                    pressStyle={{ opacity: 0.8 }}
                                                    onPress={handleLogin}
                                                    disabled={isLoading || authLoading}
                                                >
                                                    {isLoading || authLoading ? (
                                                        <Spinner color="$colorBox" />
                                                    ) : (
                                                        <Text color="$colorBox" fontSize={16} fontWeight="700">
                                                            Đăng nhập
                                                        </Text>
                                                    )}
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
                                                        onPress={() => handleFaceIdLogin(false)}
                                                        icon={
                                                            <MaterialCommunityIcons
                                                                name={biometricType === 'fingerprint' ? 'fingerprint' : 'face-recognition'}
                                                                size={30}
                                                                color={theme.tertiary?.val}
                                                            />
                                                        }
                                                    />
                                                )}
                                            </XStack>

                                            <Pressable onPress={handleForgotPassword}>
                                                <Text color="$color" fontSize={14} opacity={0.8}>
                                                    Quên mật khẩu?
                                                </Text>
                                            </Pressable>
                                        </YStack>
                                    )}
                                </YStack>

                                {/* Bottom Section: Quick Actions */}
                                <YStack marginBottom={8} gap={20}>
                                    {/* Quick Shortcuts */}
                                    <XStack justifyContent="space-around" paddingHorizontal={24}>
                                        <QuickAction
                                            icon="notifications-outline"
                                            label="Thông báo"
                                            badge={notificationCount}
                                            onPress={() => router.push('/notifications')}
                                        />
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
                                                <Text color="$color" fontSize={11}>
                                                    Đăng ký
                                                </Text>
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

const QuickAction = memo(function QuickAction({ icon, label, badge, onPress }: { icon: any; label: string; badge?: number; onPress?: () => void }) {
    const theme = useTheme();
    const badgeText = badge ? formatBadgeCount(badge) : '';

    return (
        <YStack alignItems="center" gap={8} opacity={0.9} pressStyle={{ opacity: 0.6 }} onPress={onPress}>
            <YStack>
                <Circle size={56} backgroundColor="$colorBox" borderWidth={1} borderColor="$borderColor">
                    <Ionicons name={icon} size={24} color={theme.color?.val} />
                </Circle>
                {badge ? (
                    <Circle position="absolute" top={-4} right={-4} size={22} backgroundColor="$red" justifyContent="center" alignItems="center">
                        <Text color="white" fontSize={badge > 99 ? 8 : 10} fontWeight="bold">
                            {badgeText}
                        </Text>
                    </Circle>
                ) : null}
            </YStack>
            <Text color="$color" fontSize={12} fontWeight="500">
                {label}
            </Text>
        </YStack>
    );
});

const FooterAction = memo(function FooterAction({ icon, label, hasBadge }: { icon: any; label: string; hasBadge?: boolean }) {
    const theme = useTheme();
    return (
        <YStack alignItems="center" gap={4} opacity={0.7} pressStyle={{ opacity: 0.4 }}>
            <YStack>
                <Ionicons name={icon} size={24} color={theme.color?.val} />
                {hasBadge ? <Circle position="absolute" top={0} right={0} size={8} backgroundColor="red" /> : null}
            </YStack>
            <Text color="$color" fontSize={11} width={60} textAlign="center">
                {label}
            </Text>
        </YStack>
    );
});
