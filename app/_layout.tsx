import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { TamaguiProvider } from 'tamagui';
import config from '../tamagui.config';

import { AuthProvider } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const tamaguiTheme = colorScheme === 'dark' ? 'dark_fintech' : 'light_fintech';

    return (
        <AuthProvider>
            <TamaguiProvider config={config} defaultTheme={tamaguiTheme}>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                    <Stack screenOptions={{ headerStyle: { backgroundColor: '#2D281F' } }}>
                        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
                        <Stack.Screen name="register" options={{ headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                        <Stack.Screen name="qr-receive" options={{ presentation: 'modal' }} />
                    </Stack>
                    <StatusBar style="auto" />
                </ThemeProvider>
            </TamaguiProvider>
        </AuthProvider>
    );
}
