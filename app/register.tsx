import React, { useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Check as CheckIcon } from '@tamagui/lucide-icons'
import { YStack, XStack, Text, Input, Button, useTheme, ScrollView, Checkbox } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
    const theme = useTheme();
    const scrollViewRef = useRef<ScrollView>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agree: false
    });

    const [showPassword, setShowPassword] = useState(false);

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
                            <Text color="$color" fontWeight="600" marginLeft={4}>Họ và tên</Text>
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
                            <Text color="$color" fontWeight="600" marginLeft={4}>Email hoặc Số điện thoại</Text>
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
                                    value={formData.email}
                                    onChangeText={t => setFormData({...formData, email: t})}
                                    color="$color"
                                />
                            </XStack>
                        </YStack>

                        {/* Phone */}
                        <YStack gap={8}>
                            <Text color="$color" fontWeight="600" marginLeft={4}>Số điện thoại</Text>
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
                                    placeholder="0123456789"
                                    placeholderTextColor="$tertiary"
                                    keyboardType="phone-pad"
                                    value={formData.phone}
                                    onChangeText={t => setFormData({...formData, phone: t})}
                                    color="$color"
                                />
                            </XStack>
                        </YStack>

                        {/* Password */}
                        <YStack gap={8}>
                            <Text color="$color" fontWeight="600" marginLeft={4}>Mật khẩu</Text>
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
                        </YStack>

                        {/* Confirm Password */}
                        <YStack gap={8}>
                            <Text color="$color" fontWeight="600" marginLeft={4}>Xác nhận mật khẩu</Text>
                            <XStack 
                                height={56} 
                                borderRadius={16} 
                                alignItems="center" 
                                paddingHorizontal={16}
                                borderWidth={1}
                                borderColor="$borderColor"
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
                            </XStack>
                        </YStack>

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
                        onPress={() => router.replace('/login')}
                        marginTop={8}
                    >
                        <Text color="$colorBox" fontSize={18} fontWeight="700">Đăng ký</Text>
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
