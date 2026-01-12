import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, ScrollView, useTheme, Button, Circle } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

// Mock data for notifications
const notificationsData = [
    {
        id: '1',
        title: 'Thanh toán thành công',
        message: 'Bạn đã thanh toán 150,000đ cho Tiền điện.',
        time: '2 giờ trước',
        type: 'payment',
        read: false,
    },
    {
        id: '2',
        title: 'Nhắc nhở: Tiền nhà',
        message: 'Đừng quên thanh toán tiền nhà cho tháng này nhé!',
        time: '5 giờ trước',
        type: 'alert',
        read: false,
    },
    {
        id: '3',
        title: 'Đã nhận lương',
        message: 'Tài khoản của bạn đã được cộng thêm 9,500,000đ.',
        time: '1 ngày trước',
        type: 'income',
        read: true,
    },
    {
        id: '4',
        title: 'Cập nhật bảo mật',
        message: 'Chúng tôi đã cập nhật chính sách bảo mật mới.',
        time: '2 ngày trước',
        type: 'system',
        read: true,
    },
];

const getIconName = (type: string) => {
    switch (type) {
        case 'payment': return 'checkmark-circle';
        case 'alert': return 'alert-circle';
        case 'income': return 'wallet';
        case 'system': return 'shield-checkmark';
        default: return 'notifications';
    }
};

const getIconColor = (type: string) => {
    switch (type) {
        case 'payment': return '#10B981'; // Green
        case 'alert': return '#EF4444'; // Red
        case 'income': return '#3B82F6'; // Blue
        case 'system': return '#F59E0B'; // Orange
        default: return '#94A3B8';
    }
};

export default function NotificationsScreen() {
    const theme = useTheme();
    const [notifications, setNotifications] = useState(notificationsData);

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <YStack flex={1} backgroundColor="$primary">
            <Stack.Screen 
                options={{ 
                    title: 'Thông báo',
                    headerBackTitle: 'Trang chủ', 
                    headerTintColor: theme.color?.val,
                    headerRight: () => (
                        <Button 
                            chromeless
                            color="$tertiary"
                            fontSize={14}
                            onPress={handleMarkAllAsRead}
                            padding={0}
                        >
                            Đọc tất cả
                        </Button>
                    )
                }} 
            />
            <SafeAreaView edges={['left', 'right']} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    <YStack paddingHorizontal={24} gap={16} marginTop={16}>
                        {notifications.length === 0 ? (
                            <YStack alignItems="center" justifyContent="center" height={300}>
                                <Ionicons name="notifications-off-outline" size={48} color={theme.tertiary?.val} />
                                <Text color="$tertiary" fontSize={16} marginTop={12}>Chưa có thông báo nào</Text>
                            </YStack>
                        ) : (
                            notifications.map((item) => (
                                <YStack 
                                    key={item.id}
                                    backgroundColor={item.read ? 'rgba(255, 255, 255, 0.01)' : 'rgba(255, 255, 255, 0.08)'}
                                    borderRadius={20}
                                    padding={16}
                                    borderWidth={1}
                                    borderColor="$borderColor"
                                    pressStyle={{ opacity: 0.8 }}
                                    onPress={() => handleMarkAsRead(item.id)}
                                >
                                    <XStack gap={16} alignItems="flex-start">
                                        <Circle 
                                            size={40} 
                                            backgroundColor={item.read ? 'rgba(255,255,255,0.06)' : 'rgba(255, 255, 255, 0.1)'}
                                            alignItems="center"
                                            justifyContent="center"
                                        >
                                            <Ionicons 
                                                name={getIconName(item.type) as any} 
                                                size={20} 
                                                color={item.read ? theme.muted?.val : getIconColor(item.type)} 
                                            />
                                        </Circle>
                                        <YStack flex={1} gap={4}>
                                            <XStack justifyContent="space-between" alignItems="center">
                                                <Text 
                                                    color="$tertiary"
                                                    fontSize={16} 
                                                    fontWeight={item.read ? '400' : '600'}
                                                >
                                                    {item.title}
                                                </Text>
                                                {!item.read && (
                                                    <Circle size={8} backgroundColor="$tertiary" shadowColor="$primary" shadowRadius={5} shadowOpacity={0.5} />
                                                )}
                                            </XStack>
                                            <Text 
                                                color="$tertiary"
                                                fontSize={14} 
                                                lineHeight={20}
                                                opacity={item.read ? 0.7 : 1}
                                            >
                                                {item.message}
                                            </Text>
                                            <Text 
                                                color="$tertiaryHover" 
                                                fontSize={12} 
                                                opacity={item.read ? 0.7 : 0.9}
                                                marginTop={4}
                                            >
                                                {item.time}
                                            </Text>
                                        </YStack>
                                    </XStack>
                                </YStack>
                            ))
                        )}
                    </YStack>
                </ScrollView>
            </SafeAreaView>
        </YStack>
    );
}
