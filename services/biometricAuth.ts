import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Secure storage keys
const CREDENTIALS_KEY = 'userPassword';
const FACE_ID_ENABLED_KEY = 'faceIdEnabled';

export type BiometricType = 'face' | 'fingerprint' | 'iris' | null;

export interface BiometricAuthResult {
    success: boolean;
    error?: string;
}

/**
 * Check if biometric hardware is available on the device
 */
export async function isBiometricAvailable(): Promise<boolean> {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        return hasHardware;
    } catch {
        return false;
    }
}

/**
 * Check if user has enrolled biometrics on their device
 */
export async function isBiometricEnrolled(): Promise<boolean> {
    try {
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return isEnrolled;
    } catch {
        return false;
    }
}

/**
 * Get the type of biometric available (Face ID, Touch ID, Fingerprint, etc.)
 */
export async function getBiometricType(): Promise<BiometricType> {
    try {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            return 'face';
        }
        if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            return 'fingerprint';
        }
        if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            return 'iris';
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Authenticate using biometrics (Face ID / Touch ID / Fingerprint)
 */
export async function authenticateWithBiometric(): Promise<BiometricAuthResult> {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Xác thực để đăng nhập',
            fallbackLabel: '', // Hide fallback label
            disableDeviceFallback: true, // Don't allow device PIN fallback
            cancelLabel: 'Hủy',
        });

        if (result.success) {
            return { success: true };
        }

        // Handle different error types
        if (result.error === 'user_cancel') {
            return { success: false, error: 'Đã hủy xác thực' };
        }
        if (result.error === 'user_fallback') {
            return { success: false, error: 'Người dùng chọn phương thức khác' };
        }
        if (result.error === 'system_cancel') {
            return { success: false, error: 'Hệ thống đã hủy xác thực' };
        }
        if (result.error === 'lockout') {
            return { success: false, error: 'Quá nhiều lần thử. Vui lòng thử lại sau.' };
        }

        return { success: false, error: 'Xác thực thất bại' };
    } catch (error) {
        return { success: false, error: 'Đã xảy ra lỗi khi xác thực' };
    }
}

/**
 * Store user credentials securely
 */
export async function saveCredentials(password: string): Promise<void> {
    await SecureStore.setItemAsync(CREDENTIALS_KEY, password);
}

/**
 * Retrieve stored credentials
 */
export async function getStoredCredentials(): Promise<string | null> {
    try {
        const password = await SecureStore.getItemAsync(CREDENTIALS_KEY);
        return password;
    } catch {
        return null;
    }
}

/**
 * Check if Face ID is enabled for this app
 */
export async function isFaceIdEnabled(): Promise<boolean> {
    try {
        const enabled = await SecureStore.getItemAsync(FACE_ID_ENABLED_KEY);
        return enabled === 'true';
    } catch {
        return false;
    }
}

/**
 * Enable or disable Face ID
 */
export async function setFaceIdEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(FACE_ID_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Clear all stored credentials and disable Face ID
 */
export async function clearCredentials(): Promise<void> {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    await SecureStore.deleteItemAsync(FACE_ID_ENABLED_KEY);
}

/**
 * Check if biometric authentication is fully available and ready
 * (hardware exists, user enrolled, and enabled in app)
 */
export async function isBiometricReady(): Promise<boolean> {
    const hasHardware = await isBiometricAvailable();
    const isEnrolled = await isBiometricEnrolled();
    const isEnabled = await isFaceIdEnabled();

    return hasHardware && isEnrolled && isEnabled;
}
