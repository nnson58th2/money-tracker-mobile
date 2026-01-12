import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { router, useSegments, useRootNavigationState } from 'expo-router';
import * as BiometricAuth from '../services/biometricAuth';

type AuthContextType = {
    isAuthenticated: boolean;
    login: (password: string) => boolean;
    logout: () => void;
    // Face ID related
    isFaceIdEnabled: boolean;
    isBiometricAvailable: boolean;
    biometricType: BiometricAuth.BiometricType;
    enableFaceId: (password: string) => Promise<boolean>;
    disableFaceId: () => Promise<void>;
    loginWithFaceId: () => Promise<{ success: boolean; error?: string }>;
    checkBiometricStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    login: () => false,
    logout: () => {},
    // Face ID defaults
    isFaceIdEnabled: false,
    isBiometricAvailable: false,
    biometricType: null,
    enableFaceId: async () => false,
    disableFaceId: async () => {},
    loginWithFaceId: async () => ({ success: false }),
    checkBiometricStatus: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isFaceIdEnabled, setIsFaceIdEnabled] = useState(false);
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
    const [biometricType, setBiometricType] = useState<BiometricAuth.BiometricType>(null);
    const segments = useSegments();

    const login = (password: string) => {
        if (password === '123') {
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const logout = async () => {
        setIsAuthenticated(false);
    };

    // Check biometric availability and Face ID status on mount
    const checkBiometricStatus = useCallback(async () => {
        const hasHardware = await BiometricAuth.isBiometricAvailable();
        const isEnrolled = await BiometricAuth.isBiometricEnrolled();
        const type = await BiometricAuth.getBiometricType();
        const enabled = await BiometricAuth.isFaceIdEnabled();

        setIsBiometricAvailable(hasHardware && isEnrolled);
        setBiometricType(type);
        setIsFaceIdEnabled(enabled);
    }, []);

    // Enable Face ID and store credentials
    const enableFaceId = useCallback(async (password: string): Promise<boolean> => {
        try {
            await BiometricAuth.saveCredentials(password);
            await BiometricAuth.setFaceIdEnabled(true);
            setIsFaceIdEnabled(true);
            return true;
        } catch {
            return false;
        }
    }, []);

    // Disable Face ID and clear credentials
    const disableFaceId = useCallback(async () => {
        await BiometricAuth.clearCredentials();
        setIsFaceIdEnabled(false);
    }, []);

    // Login using Face ID
    const loginWithFaceId = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
        // First authenticate with biometrics
        const authResult = await BiometricAuth.authenticateWithBiometric();

        if (!authResult.success) {
            return { success: false, error: authResult.error };
        }

        // If biometric auth successful, get stored credentials
        const storedPassword = await BiometricAuth.getStoredCredentials();

        if (!storedPassword) {
            // Credentials missing, disable Face ID
            await disableFaceId();
            return { success: false, error: 'Thông tin đăng nhập không tìm thấy. Vui lòng đăng nhập lại.' };
        }

        // Login with stored credentials
        const loginSuccess = login(storedPassword);

        if (loginSuccess) {
            return { success: true };
        }

        return { success: false, error: 'Đăng nhập thất bại' };
    }, [disableFaceId]);

    // Check biometric status on mount
    useEffect(() => {
        checkBiometricStatus();
    }, [checkBiometricStatus]);

    const rootNavigationState = useRootNavigationState();

    useEffect(() => {
        if (!rootNavigationState?.key) return;

        const inAuthGroup = segments[0] === '(tabs)';

        if (!isAuthenticated && inAuthGroup) {
            // Delay navigation slightly to ensure the root layout is fully mounted
            setTimeout(() => {
                router.replace('/login');
            }, 0);
            return;
        }

        if (isAuthenticated && segments[0] === 'login') {
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 0);
        }
    }, [isAuthenticated, segments, rootNavigationState]);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            login,
            logout,
            isFaceIdEnabled,
            isBiometricAvailable,
            biometricType,
            enableFaceId,
            disableFaceId,
            loginWithFaceId,
            checkBiometricStatus,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
