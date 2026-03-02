import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, ScrollView, Spinner, Text, useTheme, XStack, YStack } from 'tamagui';

import { useAuth } from '@/context/AuthContext';
import { lookupEmailByPhone } from '@/services/authService';

type ViewState = 'form' | 'loading' | 'success';

export default function ForgotPasswordScreen() {
    const theme = useTheme();
    const { resetPassword } = useAuth();
    const { identifier: paramIdentifier } = useLocalSearchParams<{ identifier?: string }>();

    const [identifier, setIdentifier] = useState(paramIdentifier ?? '');
    const [error, setError] = useState<string | null>(null);
    const [viewState, setViewState] = useState<ViewState>('form');
    const inputRef = useRef<Input>(null);

    // Auto-focus empty field on mount
    useEffect(() => {
        if (!identifier) {
            const t = setTimeout(() => inputRef.current?.focus(), 300);
            return () => clearTimeout(t);
        }
    }, []);

    // Same detection logic as login.tsx
    const identifierType = identifier.includes('@') ? 'email' : /^\d+$/.test(identifier) && identifier.length >= 10 ? 'phone' : null;

    const handleSubmit = async () => {
        setError(null);
        const trimmed = identifier.trim();

        if (!trimmed) {
            setError('Vui lòng nhập email hoặc số điện thoại');
            return;
        }
        if (!identifierType) {
            setError('Vui lòng nhập email hoặc số điện thoại hợp lệ');
            return;
        }

        setViewState('loading');
        try {
            let emailToReset = trimmed;
            if (identifierType === 'phone') {
                const found = await lookupEmailByPhone(trimmed);
                if (!found) {
                    setError('Không tìm thấy tài khoản với số điện thoại này');
                    setViewState('form');
                    return;
                }
                emailToReset = found;
            }
            const result = await resetPassword(emailToReset);
            if (result.success) {
                setViewState('success');
            } else {
                setError(result.error ?? 'Không thể gửi email. Vui lòng thử lại.');
                setViewState('form');
            }
        } catch {
            setError('Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
            setViewState('form');
        }
    };

    // router.replace removes this screen from stack (user can't back-swipe to success)
    const handleBackToLogin = () => router.replace('/login');
    const handleTryAgain = () => {
        setError(null);
        setViewState('form');
    };

    return (
        <YStack flex={1} backgroundColor="$primary">
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <XStack alignItems="center" paddingHorizontal={16} paddingVertical={12}>
                    <Button
                        size="$3"
                        circular
                        chromeless
                        icon={<Ionicons name="arrow-back" size={24} color={theme.color?.val} />}
                        onPress={handleBackToLogin}
                    />
                    <Text color="$color" fontSize={20} fontWeight="700" marginLeft={8}>
                        Quên mật khẩu
                    </Text>
                </XStack>

                <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
                    {viewState !== 'success' ? (
                        <YStack gap={16}>
                            {/* Subtitle */}
                            <Text color="$tertiary" fontSize={14}>
                                Nhập email hoặc số điện thoại đã đăng ký để nhận link đặt lại mật khẩu.
                            </Text>

                            {/* Identifier field */}
                            <YStack gap={8}>
                                <Text color="$color" fontWeight="600" marginLeft={4}>
                                    Email hoặc số điện thoại <Text color="$red10">*</Text>
                                </Text>
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
                                        color={theme.tertiary?.val}
                                    />
                                    <Input
                                        ref={inputRef}
                                        flex={1}
                                        backgroundColor="transparent"
                                        borderWidth={0}
                                        placeholder="example@email.com hoặc 09xxxxxxxx"
                                        placeholderTextColor="$tertiary"
                                        value={identifier}
                                        onChangeText={(t) => {
                                            setIdentifier(t);
                                            if (error) setError(null);
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        color="$color"
                                        returnKeyType="send"
                                        onSubmitEditing={handleSubmit}
                                    />
                                    {identifierType && <Ionicons name="checkmark-circle" size={20} color="green" />}
                                </XStack>
                                <Text color="$tertiary" fontSize={12} marginLeft={4}>
                                    Email xác nhận sẽ được gửi đến địa chỉ đã đăng ký
                                </Text>
                            </YStack>

                            {/* Error display */}
                            {error && (
                                <Text color="$red10" textAlign="center" fontSize={14}>
                                    {error}
                                </Text>
                            )}

                            {/* Submit button */}
                            <Button
                                backgroundColor="$tertiary"
                                height={56}
                                borderRadius={16}
                                pressStyle={{ opacity: 0.8 }}
                                onPress={handleSubmit}
                                disabled={viewState === 'loading'}
                                marginTop={8}
                            >
                                {viewState === 'loading' ? (
                                    <Spinner color="$colorBox" />
                                ) : (
                                    <Text color="$colorBox" fontSize={18} fontWeight="700">
                                        Gửi đặt lại
                                    </Text>
                                )}
                            </Button>

                            {/* Footer link */}
                            <XStack justifyContent="center" gap={4} marginTop={16}>
                                <Text color="$tertiary">Đã nhớ mật khẩu?</Text>
                                <Text color="$success" fontWeight="700" onPress={handleBackToLogin}>
                                    Đăng nhập ngay
                                </Text>
                            </XStack>
                        </YStack>
                    ) : (
                        /* SUCCESS STATE */
                        <YStack gap={24} alignItems="center" paddingTop={32}>
                            <YStack
                                width={80}
                                height={80}
                                borderRadius={40}
                                backgroundColor="$secondary"
                                borderWidth={2}
                                borderColor="$success"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Ionicons name="checkmark-circle-outline" size={44} color={theme.success?.val} />
                            </YStack>

                            <YStack gap={8} alignItems="center">
                                <Text color="$color" fontSize={20} fontWeight="700" textAlign="center">
                                    Email đã được gửi!
                                </Text>
                                <Text color="$tertiary" fontSize={14} textAlign="center" lineHeight={22}>
                                    Vui lòng kiểm tra hộp thư{'\n'}và nhấn link để đặt lại mật khẩu.
                                </Text>
                                <Text color="$tertiary" fontSize={12} textAlign="center" marginTop={4}>
                                    (Kiểm tra cả thư mục spam nếu không thấy)
                                </Text>
                            </YStack>

                            <Button
                                width="100%"
                                backgroundColor="$tertiary"
                                height={56}
                                borderRadius={16}
                                pressStyle={{ opacity: 0.8 }}
                                onPress={handleBackToLogin}
                                marginTop={8}
                            >
                                <Text color="$colorBox" fontSize={18} fontWeight="700">
                                    Quay lại đăng nhập
                                </Text>
                            </Button>

                            <XStack justifyContent="center" gap={4}>
                                <Text color="$tertiary">Dùng địa chỉ khác?</Text>
                                <Text color="$success" fontWeight="700" onPress={handleTryAgain}>
                                    Gửi lại
                                </Text>
                            </XStack>
                        </YStack>
                    )}
                </ScrollView>
            </SafeAreaView>
        </YStack>
    );
}
