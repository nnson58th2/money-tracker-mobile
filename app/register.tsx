import React, { useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Check as CheckIcon } from '@tamagui/lucide-icons';
import { YStack, XStack, Text, Input, Button, useTheme, ScrollView, Checkbox, Spinner } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';

import { useAuth } from '@/context/AuthContext';

// Password validation
const validatePassword = (password: string): { valid: boolean; error?: string } => {
    if (password.length < 8) {
        return { valid: false, error: 'Mật khẩu phải có ít nhất 8 ký tự' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: 'Mật khẩu phải có ít nhất 1 chữ hoa' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, error: 'Mật khẩu phải có ít nhất 1 chữ thường' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'Mật khẩu phải có ít nhất 1 số' };
    }
    return { valid: true };
};

// Email validation
const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Phone validation (Vietnamese format)
const validatePhone = (phone: string): boolean => {
    // Vietnamese phone format: 10 digits starting with 0
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone);
};

export default function RegisterScreen() {
    const theme = useTheme();
    const scrollViewRef = useRef<ScrollView>(null);
    const { register, isLoading, authError, clearError } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agree: false
    });

    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // Password strength indicator
    const getPasswordStrength = () => {
        const { password } = formData;
        if (!password) return { level: 0, text: '', color: '$tertiary' };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        if (strength <= 2) return { level: strength, text: 'Yếu', color: '$red10' };
        if (strength <= 3) return { level: strength, text: 'Trung bình', color: '$warning' };
        return { level: strength, text: 'Mạnh', color: '$success' };
    };

    const passwordStrength = getPasswordStrength();

    const handleRegister = async () => {
        // Clear previous errors
        clearError();
        setLocalError(null);

        // Validate name
        if (!formData.name.trim()) {
            setLocalError('Vui lòng nhập họ và tên');
            return;
        }

        // Validate email
        if (!validateEmail(formData.email)) {
            setLocalError('Email không hợp lệ');
            return;
        }

        // Validate phone
        if (!validatePhone(formData.phone)) {
            setLocalError('Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)');
            return;
        }

        // Validate password
        const passwordCheck = validatePassword(formData.password);
        if (!passwordCheck.valid) {
            setLocalError(passwordCheck.error!);
            return;
        }

        // Check password match
        if (formData.password !== formData.confirmPassword) {
            setLocalError('Mật khẩu xác nhận không khớp');
            return;
        }

        // Check terms accepted
        if (!formData.agree) {
            setLocalError('Vui lòng đồng ý với điều khoản sử dụng');
            return;
        }

        const success = await register({
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            password: formData.password,
            displayName: formData.name.trim(),
        });

        if (success) {
            Alert.alert(
                'Đăng ký thành công',
                'Chúng tôi đã gửi email xác nhận. Vui lòng kiểm tra hộp thư và nhấn link xác nhận trước khi đăng nhập.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/login'),
                    },
                ]
            );
        } else {
            // Error is already set in authError
            if (authError) {
                Alert.alert('Đăng ký thất bại', authError);
            }
        }
    };

    const displayError = localError || authError;

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
                        onPress={() => router.back()}
                    />
                    <Text color="$color" fontSize={20} fontWeight="700" marginLeft={8}>Đăng ký tài khoản</Text>
                </XStack>

                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={{ padding: 24, gap: 24 }}
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustKeyboardInsets
                >
                    <YStack gap={16}>
                        {/* Name */}
                        <YStack gap={8}>
                            <Text color="$color" fontWeight="600" marginLeft={4}>Họ và tên <Text color="$red10">*</Text></Text>
                            <XStack
                                height={56}
                                borderRadius={16}
                                alignItems="center"
                                paddingHorizontal={16}
                                borderWidth={1}
                                borderColor="$borderColor"
                                backgroundColor="$secondary"
                            >
                                <Ionicons name="person-outline" size={20} color={theme.tertiary?.val} />
                                <Input
                                    flex={1}
                                    backgroundColor="transparent"
                                    borderWidth={0}
                                    placeholder="Nguyễn Văn A"
                                    placeholderTextColor="$tertiary"
                                    value={formData.name}
                                    onChangeText={t => setFormData({...formData, name: t})}
                                    color="$color"
                                />
                            </XStack>
                        </YStack>

                        {/* Email */}
                        <YStack gap={8}>
                            <Text color="$color" fontWeight="600" marginLeft={4}>Email <Text color="$red10">*</Text></Text>
                            <XStack
                                height={56}
                                borderRadius={16}
                                alignItems="center"
                                paddingHorizontal={16}
                                borderWidth={1}
                                borderColor="$borderColor"
                                backgroundColor="$secondary"
                            >
                                <Ionicons name="mail-outline" size={20} color={theme.tertiary?.val} />
                                <Input
                                    flex={1}
                                    backgroundColor="transparent"
                                    borderWidth={0}
                                    placeholder="example@email.com"
                                    placeholderTextColor="$tertiary"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={formData.email}
                                    onChangeText={t => setFormData({...formData, email: t})}
                                    color="$color"
                                />
                                {validateEmail(formData.email) && (
                                    <Ionicons name="checkmark-circle" size={20} color="green" />
                                )}
                            </XStack>
                            <Text color="$tertiary" fontSize={12} marginLeft={4}>
                                Email sẽ dùng để xác thực tài khoản
                            </Text>
                        </YStack>

                        {/* Phone */}
                        <YStack gap={8}>
                            <Text color="$color" fontWeight="600" marginLeft={4}>Số điện thoại <Text color="$red10">*</Text></Text>
                            <XStack
                                height={56}
                                borderRadius={16}
                                alignItems="center"
                                paddingHorizontal={16}
                                borderWidth={1}
                                borderColor="$borderColor"
                                backgroundColor="$secondary"
                            >
                                <Ionicons name="call-outline" size={20} color={theme.tertiary?.val} />
                                <Input
                                    flex={1}
                                    backgroundColor="transparent"
                                    borderWidth={0}
                                    placeholder="0912345678"
                                    placeholderTextColor="$tertiary"
                                    keyboardType="phone-pad"
                                    value={formData.phone}
                                    onChangeText={t => setFormData({...formData, phone: t.replace(/[^0-9]/g, '')})}
                                    maxLength={10}
                                    color="$color"
                                />
                                {validatePhone(formData.phone) && (
                                    <Ionicons name="checkmark-circle" size={20} color="green" />
                                )}
                            </XStack>
                            <Text color="$tertiary" fontSize={12} marginLeft={4}>
                                Có thể dùng số điện thoại để đăng nhập
                            </Text>
                        </YStack>

                        {/* Password */}
                        <YStack gap={8}>
                            <Text color="$color" fontWeight="600" marginLeft={4}>Mật khẩu <Text color="$red10">*</Text></Text>
                            <XStack
                                height={56}
                                borderRadius={16}
                                alignItems="center"
                                paddingHorizontal={16}
                                borderWidth={1}
                                borderColor="$borderColor"
                                backgroundColor="$secondary"
                            >
                                <Ionicons name="lock-closed-outline" size={20} color={theme.tertiary?.val} />
                                <Input
                                    flex={1}
                                    backgroundColor="transparent"
                                    borderWidth={0}
                                    placeholder="Ít nhất 8 ký tự"
                                    placeholderTextColor="$tertiary"
                                    secureTextEntry={!showPassword}
                                    value={formData.password}
                                    onChangeText={t => setFormData({...formData, password: t})}
                                    color="$color"
                                />
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    padding={4}
                                    color={theme.tertiary?.val}
                                    onPress={() => setShowPassword(!showPassword)}
                                />
                            </XStack>
                            {formData.password.length > 0 && (
                                <YStack gap={4}>
                                    <XStack gap={4}>
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <YStack
                                                key={i}
                                                flex={1}
                                                height={4}
                                                borderRadius={2}
                                                backgroundColor={i <= passwordStrength.level ? passwordStrength.color : '$borderColor'}
                                            />
                                        ))}
                                    </XStack>
                                    <Text color={passwordStrength.color} fontSize={12} marginLeft={4}>
                                        Độ mạnh: {passwordStrength.text}
                                    </Text>
                                </YStack>
                            )}
                            <Text color="$tertiary" fontSize={12} marginLeft={4}>
                                Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số
                            </Text>
                        </YStack>

                        {/* Confirm Password */}
                        <YStack gap={8}>
                            <Text color="$color" fontWeight="600" marginLeft={4}>Xác nhận mật khẩu <Text color="$red10">*</Text></Text>
                            <XStack
                                height={56}
                                borderRadius={16}
                                alignItems="center"
                                paddingHorizontal={16}
                                borderWidth={1}
                                borderColor={formData.confirmPassword && formData.password !== formData.confirmPassword ? '$red10' : '$borderColor'}
                                backgroundColor="$secondary"
                            >
                                <Ionicons name="shield-checkmark-outline" size={20} color={theme.tertiary?.val} />
                                <Input
                                    flex={1}
                                    backgroundColor="transparent"
                                    borderWidth={0}
                                    placeholder="Nhập lại mật khẩu"
                                    placeholderTextColor="$tertiary"
                                    secureTextEntry={!showPassword}
                                    value={formData.confirmPassword}
                                    color="$color"
                                    onChangeText={t => setFormData({...formData, confirmPassword: t})}
                                    onFocus={() => {
                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                    }}
                                />
                                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                    <Ionicons name="checkmark-circle" size={20} color="green" />
                                )}
                            </XStack>
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <Text color="$red10" fontSize={12} marginLeft={4}>
                                    Mật khẩu không khớp
                                </Text>
                            )}
                        </YStack>

                        {/* Error Display */}
                        {displayError && (
                            <Text color="$red10" textAlign="center" fontSize={14}>
                                {displayError}
                            </Text>
                        )}

                        {/* Agree to terms and conditions */}
                        <XStack alignItems="center" gap={12} marginTop={2}>
                            <Checkbox
                                size="$4"
                                checked={formData.agree}
                                onCheckedChange={t => setFormData({...formData, agree: !!t})}
                            >
                                <Checkbox.Indicator>
                                    <CheckIcon />
                                </Checkbox.Indicator>
                            </Checkbox>
                            <Text color="$tertiary" fontSize={14} paddingRight={16}>
                                Tôi đồng ý với {''}
                                <Text fontWeight="700" color="$color" onPress={() => {}}>Điều khoản sử dụng</Text>
                                {''} và {''}
                                <Text fontWeight="700" color="$color" onPress={() => {}}>Chính sách bảo mật</Text>
                                {''} của SS Money Tracker
                            </Text>
                        </XStack>
                    </YStack>

                    <Button
                        backgroundColor="$tertiary"
                        height={56}
                        borderRadius={16}
                        pressStyle={{ opacity: 0.8 }}
                        onPress={handleRegister}
                        disabled={isLoading}
                        marginTop={8}
                    >
                        {isLoading ? (
                            <Spinner color="$colorBox" />
                        ) : (
                            <Text color="$colorBox" fontSize={18} fontWeight="700">Đăng ký</Text>
                        )}
                    </Button>

                    <XStack justifyContent="center" gap={4} marginTop={16}>
                        <Text color="$tertiary">Đã có tài khoản?</Text>
                        <Text
                            color="$success"
                            fontWeight="700"
                            onPress={() => router.replace('/login')}
                        >
                            Đăng nhập ngay
                        </Text>
                    </XStack>
                </ScrollView>
            </SafeAreaView>
        </YStack>
    );
}
