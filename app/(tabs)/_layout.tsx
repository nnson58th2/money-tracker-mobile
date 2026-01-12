import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconOcticons, IconOcticonsName } from '@/components/ui/icon-octicons';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { useTheme } from 'tamagui';

type TabsScreenListType = {
    name: string;
    title: string;
    icon: typeof IconOcticons | typeof IconSymbol;
    iconName: IconOcticonsName | IconSymbolName;
};

const TabsScreenList: TabsScreenListType[] = [
    { icon: IconOcticons, name: 'index', title: 'Trang chủ', iconName: 'house.fill' },
    { icon: IconSymbol, name: 'explore', title: 'Thống kê', iconName: 'chart.bar.fill' },
];

export default function TabLayout() {
    const theme = useTheme();

  return (
    <Tabs
        screenOptions={{
            tabBarActiveTintColor: theme.color?.val,
            tabBarInactiveTintColor: theme.tertiaryHover?.val,
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarStyle: {
                borderColor: theme.borderColor?.val,
                borderTopWidth: 1,
                backgroundColor: '#2D2620',
                height: 70,
            },
        }}>
            {TabsScreenList.map((screen) => (
                <Tabs.Screen
                    key={screen.name}
                    name={screen.name}
                    options={{
                        title: screen.title,
                        tabBarIcon: ({ color }) => {
                            const Icon = screen.icon;
                            return <Icon size={28} name={screen.iconName} color={color} />;
                        },
                    }}
                />
            ))}
        </Tabs>
    );
}
