import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Input, Button, Image, useTheme, ScrollView } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import BlurCard from '@/components/BlurCard';
import { BANKS, DEFAULT_BANK_CODE, getBankByCode } from '@/constants/banks';
import { generateQRUrl, formatAmount, parseAmount } from '@/utils/qrGenerator';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DEBOUNCE_DELAY = 2000; // 2 seconds

export default function QRReceiveScreen() {
    const theme = useTheme();

    // Form state
    const [selectedBankCode, setSelectedBankCode] = useState(DEFAULT_BANK_CODE);
    const [accountNumber, setAccountNumber] = useState('2306988888');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    // Account holder name
    const accountHolderName = 'NGUYEN NHU SON';

    // UI state
    const [showBankDropdown, setShowBankDropdown] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    // QR URL state (debounced)
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const selectedBank = getBankByCode(selectedBankCode);

    // Debounced QR URL generation
    const generateQR = useCallback(() => {
        if (!accountNumber.trim()) {
            setQrUrl(null);
            setIsGenerating(false);
            return;
        }

        const url = generateQRUrl({
            accountNumber: accountNumber.trim(),
            bankCode: selectedBankCode,
            amount: parseAmount(amount),
            description: description.trim(),
        });

        setQrUrl(url);
        setIsGenerating(false);
    }, [accountNumber, selectedBankCode, amount, description]);

    // Effect to handle debounced QR generation
    useEffect(() => {
        // Clear previous timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Show generating state
        if (accountNumber.trim()) {
            setIsGenerating(true);
        }

        // Set new timer
        debounceTimer.current = setTimeout(() => {
            generateQR();
        }, DEBOUNCE_DELAY);

        // Cleanup
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [accountNumber, selectedBankCode, amount, description, generateQR]);

    const handleAmountChange = (value: string) => {
        setAmount(formatAmount(value));
    };

    const handleBankSelect = (bankCode: string) => {
        setSelectedBankCode(bankCode);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowBankDropdown(false);
    };

    const toggleBankDropdown = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowBankDropdown(!showBankDropdown);
    };

    const handleShare = async () => {
        if (!qrUrl) return;

        setIsSharing(true);
        try {
            // Check if sharing is available
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert('Lỗi', 'Chia sẻ không khả dụng trên thiết bị này');
                setIsSharing(false);
                return;
            }

            // Generate filename with timestamp
            const timestamp = new Date().getTime();
            const filename = `QR_${selectedBank?.code}_${accountNumber}_${timestamp}.png`;
            const fileUri = `${FileSystem.cacheDirectory}${filename}`;

            // Download QR image
            const downloadResult = await FileSystem.downloadAsync(qrUrl, fileUri);

            if (downloadResult.status === 200) {
                // Share the image file
                await Sharing.shareAsync(downloadResult.uri, {
                    mimeType: 'image/png',
                    dialogTitle: `QR - ${selectedBank?.name} - ${accountNumber}`,
                    UTI: 'public.png',
                });
            } else {
                throw new Error('Download failed');
            }
        } catch (error) {
            console.error('Share error:', error);
            Alert.alert('Lỗi', 'Không thể chia sẻ mã QR. Vui lòng thử lại.');
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <YStack flex={1} backgroundColor="$primary">
            <Stack.Screen
                options={{
                    title: 'QR Nhận tiền',
                    headerStyle: { backgroundColor: theme.primary?.val },
                    headerTintColor: theme.color?.val,
                }}
            />

            <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1 }}>
                <YStack flex={1}>
                    <ScrollView
                        flex={1}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    >
                        <YStack paddingHorizontal={24} paddingTop={20} gap={20}>

                            {/* QR Code Display */}
                            <BlurCard intensity={10} paddingHorizontal={20} paddingVertical={20}>
                                <YStack alignItems="center" gap={16}>
                                    <YStack
                                        width={220}
                                        height={220}
                                        backgroundColor="white"
                                        borderRadius={12}
                                        padding={10}
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        {!accountNumber.trim() ? (
                                            <YStack alignItems="center" gap={8}>
                                                <Ionicons name="qr-code-outline" size={60} color="#ccc" />
                                                <Text color="#999" fontSize={12} textAlign="center">
                                                    Nhập số tài khoản
                                                </Text>
                                            </YStack>
                                        ) : isGenerating ? (
                                            <YStack alignItems="center" gap={8}>
                                                <Ionicons name="qr-code-outline" size={60} color="#ccc" />
                                                <Text color="#999" fontSize={12}>
                                                    Đang tạo QR...
                                                </Text>
                                            </YStack>
                                        ) : qrUrl ? (
                                            <Image
                                                source={{ uri: qrUrl }}
                                                width={200}
                                                height={200}
                                                resizeMode="contain"
                                            />
                                        ) : null}
                                    </YStack>

                                    {/* Account info below QR */}
                                    <YStack alignItems="center" gap={8}>
                                        <Text color="$color" fontSize={16} fontWeight="700">
                                            {accountHolderName}
                                        </Text>
                                        {accountNumber ? (
                                            <Text color="$tertiary" fontSize={14}>
                                                {accountNumber}
                                            </Text>
                                        ) : (
                                            <Text color="$tertiary" fontSize={14}>
                                                ---
                                            </Text>
                                        )}
                                        {amount && (
                                            <Text color="$success" fontSize={16} fontWeight="600">
                                                {amount} ₫
                                            </Text>
                                        )}
                                        {description.trim() && (
                                            <Text color="$tertiary" fontSize={14}>
                                                {description.trim()}
                                            </Text>
                                        )}
                                    </YStack>
                                </YStack>
                            </BlurCard>

                            {/* Bank Selector Dropdown */}
                            <YStack gap={8}>
                                <Text color="$color" fontSize={14} fontWeight="600">
                                    Ngân hàng
                                </Text>
                                <YStack position="relative" zIndex={10}>
                                    <Button
                                        height={56}
                                        backgroundColor="$secondary"
                                        borderRadius={16}
                                        borderWidth={1}
                                        borderColor="$borderColor"
                                        pressStyle={{ opacity: 0.8 }}
                                        onPress={toggleBankDropdown}
                                        justifyContent="space-between"
                                        paddingHorizontal={16}
                                    >
                                        <XStack alignItems="center" gap={12}>
                                            {selectedBank?.logo && (
                                                <Image
                                                    source={selectedBank.logo}
                                                    width={28}
                                                    height={28}
                                                    resizeMode="contain"
                                                    backgroundColor={theme.color?.val}
                                                    borderRadius={14}
                                                />
                                            )}
                                            <Text color="$color" fontSize={16}>
                                                {selectedBank?.name || 'Chọn ngân hàng'}
                                            </Text>
                                        </XStack>
                                        <Ionicons
                                            name={showBankDropdown ? 'chevron-up' : 'chevron-down'}
                                            size={20}
                                            color={theme.color?.val}
                                        />
                                    </Button>

                                    {/* Dropdown List - Absolute Overlay */}
                                    {showBankDropdown && (
                                        <YStack
                                            position="absolute"
                                            top={64}
                                            left={0}
                                            right={0}
                                            backgroundColor="$secondary"
                                            borderWidth={1}
                                            borderColor="$borderColor"
                                            borderRadius={16}
                                            maxHeight={250}
                                            overflow="hidden"
                                            shadowColor="rgba(0, 0, 0, 0.3)"
                                            shadowOffset={{ width: 0, height: 4 }}
                                            shadowOpacity={1}
                                            shadowRadius={8}
                                            elevation={5}
                                            zIndex={1000}
                                        >
                                            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                                                {BANKS.map((bank, index) => (
                                                    <XStack
                                                        key={bank.code}
                                                        paddingHorizontal={16}
                                                        paddingVertical={12}
                                                        alignItems="center"
                                                        gap={12}
                                                        backgroundColor={selectedBankCode === bank.code ? '$tertiary' : 'transparent'}
                                                        pressStyle={{ backgroundColor: '$backgroundHover' }}
                                                        onPress={() => handleBankSelect(bank.code)}
                                                        borderTopWidth={index > 0 ? 1 : 0}
                                                        borderTopColor="$borderColor"
                                                    >
                                                        <Image
                                                            source={bank.logo}
                                                            width={32}
                                                            height={32}
                                                            resizeMode="contain"
                                                        />
                                                        <Text
                                                            flex={1}
                                                            color={selectedBankCode === bank.code ? '$colorBox' : '$color'}
                                                            fontSize={15}
                                                            fontWeight={selectedBankCode === bank.code ? '600' : '400'}
                                                        >
                                                            {bank.name}
                                                        </Text>
                                                        {selectedBankCode === bank.code && (
                                                            <Ionicons name="checkmark" size={18} color={theme.colorBox?.val} />
                                                        )}
                                                    </XStack>
                                                ))}
                                            </ScrollView>
                                        </YStack>
                                    )}
                                </YStack>
                            </YStack>

                            {/* Account Number */}
                            <YStack gap={8}>
                                <Text color="$color" fontSize={14} fontWeight="600">
                                    Số tài khoản <Text color="$red">*</Text>
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
                                    <Ionicons name="card-outline" size={20} color={theme.color?.val} />
                                    <Input
                                        flex={1}
                                        backgroundColor="transparent"
                                        borderWidth={0}
                                        placeholder="Nhập số tài khoản"
                                        placeholderTextColor="$tertiary"
                                        value={accountNumber}
                                        onChangeText={setAccountNumber}
                                        color="$color"
                                        fontSize={16}
                                        keyboardType="number-pad"
                                    />
                                </XStack>
                            </YStack>

                            {/* Amount (Optional) */}
                            <YStack gap={8}>
                                <Text color="$color" fontSize={14} fontWeight="600">
                                    Số tiền <Text color="$tertiary" fontWeight="400">(tùy chọn)</Text>
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
                                    <Ionicons name="cash-outline" size={20} color={theme.color?.val} />
                                    <Input
                                        flex={1}
                                        backgroundColor="transparent"
                                        borderWidth={0}
                                        placeholder="Nhập số tiền"
                                        placeholderTextColor="$tertiary"
                                        value={amount}
                                        onChangeText={handleAmountChange}
                                        color="$color"
                                        fontSize={16}
                                        keyboardType="number-pad"
                                    />
                                    <Text color="$tertiary" fontSize={16}>₫</Text>
                                </XStack>
                            </YStack>

                            {/* Description (Optional) */}
                            <YStack gap={8}>
                                <Text color="$color" fontSize={14} fontWeight="600">
                                    Nội dung <Text color="$tertiary" fontWeight="400">(tùy chọn)</Text>
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
                                    <Ionicons name="document-text-outline" size={20} color={theme.color?.val} />
                                    <Input
                                        flex={1}
                                        backgroundColor="transparent"
                                        borderWidth={0}
                                        placeholder="Nhập nội dung chuyển khoản"
                                        placeholderTextColor="$tertiary"
                                        value={description}
                                        onChangeText={setDescription}
                                        color="$color"
                                        fontSize={16}
                                    />
                                </XStack>
                            </YStack>
                        </YStack>
                    </ScrollView>

                    {/* Share Button - Fixed at bottom */}
                    <YStack
                        position="absolute"
                        bottom={0}
                        left={0}
                        right={0}
                        paddingHorizontal={24}
                        paddingVertical={16}
                        backgroundColor="$primary"
                        borderTopWidth={1}
                        borderTopColor="$borderColor"
                    >
                        <Button
                            width="100%"
                            height={56}
                            backgroundColor={qrUrl && !isSharing ? '$tertiary' : '$secondary'}
                            borderRadius={16}
                            pressStyle={{ opacity: 0.8 }}
                            onPress={handleShare}
                            disabled={!qrUrl || isSharing}
                            opacity={qrUrl && !isSharing ? 1 : 0.5}
                            icon={
                                isSharing ? (
                                    <Ionicons name="hourglass-outline" size={20} color={theme.tertiary?.val} />
                                ) : (
                                    <Ionicons name="share-outline" size={20} color={qrUrl ? theme.colorBox?.val : theme.tertiary?.val} />
                                )
                            }
                        >
                            <Text color={qrUrl && !isSharing ? '$colorBox' : '$tertiary'} fontSize={16} fontWeight="700">
                                {isSharing ? 'Đang chia sẻ...' : 'Chia sẻ QR'}
                            </Text>
                        </Button>
                    </YStack>
                </YStack>
            </SafeAreaView>
        </YStack>
    );
}
