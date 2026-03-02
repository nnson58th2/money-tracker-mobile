import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Modal, Platform, TextInput, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, ScrollView, Text, useTheme, XStack, YStack } from 'tamagui';

import CategoryItem, { Category } from '@/components/CategoryItem';
import { formatAmount, formatVietnameseDate } from '@/utils/formatting';

const categories: Category[] = [
    { id: 'gift', name: 'Quà tặng', icon: 'gift', color: '#EC4899' },
    { id: 'freelance', name: 'Freelance', icon: 'briefcase', color: '#3B82F6' },
    { id: 'salary', name: 'Lương', icon: 'cash', color: '#10B981' },
    { id: 'investment', name: 'Đầu tư', icon: 'trending-up', color: '#8B5CF6' },
    { id: 'bonus', name: 'Thưởng', icon: 'trophy', color: '#F59E0B' },
    { id: 'other', name: 'Khác', icon: 'ellipsis-horizontal', color: '#94A3B8' },
];

export default function IncomeScreen() {
    const theme = useTheme();
    const scrollViewRef = useRef<ScrollView>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date());
    const [tempDate, setTempDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Stable callback for category selection to prevent child re-renders
    const handleSelectedCategory = useCallback((categoryId: string) => {
        setSelectedCategory((prevCatId) => (prevCatId === categoryId ? null : categoryId));
    }, []);

    const handleChangeDate = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (selectedDate) {
                setDate(selectedDate);
            }
        } else {
            if (selectedDate) {
                setTempDate(selectedDate);
            }
        }
    };

    const handleConfirmDate = () => {
        setDate(tempDate);
        setShowDatePicker(false);
    };

    const handleCancelDate = () => {
        setShowDatePicker(false);
    };

    const openDatePicker = () => {
        setTempDate(date);
        setShowDatePicker(true);
    };

    const handleAmountChange = (text: string) => {
        setAmount(formatAmount(text));
    };

    return (
        <YStack flex={1} backgroundColor="$primary">
            <Stack.Screen options={{ title: 'Thu nhập', headerBackTitle: 'Trang chủ', headerTintColor: theme.color?.val }} />
             <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>

                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={{ paddingBottom: 60 }}
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustKeyboardInsets
                >
                    <YStack paddingHorizontal={24} marginTop={32}>
                        {/* Amount Input */}
                        <YStack alignItems="center" marginBottom={32}>
                            <Text color="$color" fontSize={16} marginBottom={12}>Số tiền nhận được</Text>
                            <XStack alignItems="center">
                                <TextInput
                                    style={{
                                        fontSize: 52,
                                        fontWeight: '700',
                                        color: theme.color?.val,
                                        minWidth: 50,
                                        textAlign: 'right',
                                    }}
                                    value={amount}
                                    onChangeText={handleAmountChange}
                                    placeholder="0"
                                    placeholderTextColor={theme.color?.val}
                                    keyboardType="numeric"
                                    autoFocus
                                />
                                <Text color={theme.color?.val} fontSize={40} fontWeight="700" marginStart={10}>₫</Text>
                            </XStack>
                        </YStack>

                        {/* Categories */}
                        <YStack marginBottom={32}>
                            <Text color="$color" fontSize={18} fontWeight="600" marginBottom={16}>Nguồn thu</Text>
                            <XStack flexWrap="wrap" gap={16} justifyContent="flex-start">
                                {categories.map((cat) => (
                                    <CategoryItem
                                        key={cat.id}
                                        category={cat}
                                        isSelected={selectedCategory === cat.id}
                                        onToggle={handleSelectedCategory}
                                    />
                                ))}
                            </XStack>
                        </YStack>

                        {/* Additional Details */}
                        <YStack gap={16}>
                            <XStack
                                backgroundColor="$primary"
                                height={56}
                                borderRadius={16}
                                alignItems="center"
                                paddingHorizontal={16}
                                borderWidth={1}
                                borderColor="$borderColor"
                                pressStyle={{ opacity: 0.7 }}
                                onPress={openDatePicker}
                            >
                                <Ionicons name="calendar-outline" size={20} color={theme.color?.val} />
                                <Text
                                    flex={1}
                                    color="$color"
                                    fontWeight="200"
                                    fontSize={16}
                                    paddingLeft={18}
                                >
                                    {formatVietnameseDate(date)}
                                </Text>
                                <Ionicons name="chevron-down" size={16} color={theme.color?.val} />
                            </XStack>

                            {/* Date Picker */}
                            {showDatePicker && (
                                Platform.OS === 'ios' ? (
                                    <Modal
                                        visible
                                        transparent
                                        animationType="slide"
                                        onRequestClose={() => setShowDatePicker(false)}
                                    >
                                        <TouchableWithoutFeedback onPress={handleCancelDate}>
                                            <YStack flex={1} justifyContent="flex-end" backgroundColor="$background">
                                                <TouchableWithoutFeedback>
                                                    <YStack backgroundColor="$primary" padding={10} borderTopLeftRadius={20} borderTopRightRadius={20}>
                                                        <XStack justifyContent="space-between">
                                                            <Button chromeless color="$color" fontWeight="400" onPress={handleCancelDate}>Hủy</Button>
                                                            <Button chromeless color="$color" fontWeight="400" onPress={handleConfirmDate}>Xong</Button>
                                                        </XStack>
                                                        <DateTimePicker
                                                            testID="dateTimePicker"
                                                            value={tempDate}
                                                            mode="date"
                                                            is24Hour
                                                            display="spinner"
                                                            textColor={theme.color?.val}
                                                            onChange={handleChangeDate}
                                                        />
                                                    </YStack>
                                                </TouchableWithoutFeedback>
                                            </YStack>
                                        </TouchableWithoutFeedback>
                                    </Modal>
                                ) : (
                                    <DateTimePicker
                                        testID="dateTimePicker"
                                        value={date}
                                        mode="date"
                                        is24Hour
                                        onChange={handleChangeDate}
                                    />
                                )
                            )}

                            {/* Note */}
                            <XStack
                                backgroundColor="$primary"
                                height={56}
                                borderRadius={16}
                                alignItems="center"
                                paddingHorizontal={16}
                                borderWidth={1}
                                borderColor="$borderColor"
                            >
                                <Ionicons name="create-outline" size={20} color={theme.color?.val} />
                                <Input
                                    flex={1}
                                    backgroundColor="transparent"
                                    borderWidth={0}
                                    placeholder="Thêm ghi chú..."
                                    placeholderTextColor={theme.color?.val}
                                    color="$color"
                                    fontSize={16}
                                    onFocus={() => {
                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                    }}
                                />
                            </XStack>
                        </YStack>
                    </YStack>
                </ScrollView>

                {/* Footer Button */}
                <YStack paddingHorizontal={24}>
                    <Button
                        backgroundColor="$tertiary"
                        height={56}
                        pressStyle={{ opacity: 0.85 }}
                        borderRadius={16}
                        borderWidth={0}
                        disabled={!selectedCategory}
                    >
                        <Text color="$colorBox" fontSize={18} fontWeight="700">Lưu</Text>
                    </Button>
                </YStack>
            </SafeAreaView>
        </YStack>
    );
}
