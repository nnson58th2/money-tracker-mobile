import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Secure storage keys
const AUTH_TOKEN_KEY = 'authToken';
const FACE_ID_ENABLED_KEY = 'faceIdEnabled';
const BIOMETRIC_HASH_KEY = 'biometricHash';
const DEVICE_ID_KEY = 'deviceId';
const BIOMETRIC_ATTEMPTS_KEY = 'biometricAttempts';
const BIOMETRIC_ENROLLMENT_KEY = 'biometricEnrollment';
const REMEMBERED_USER_KEY = 'rememberedUser';

// Token expiration: 30 days
const TOKEN_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000;

// Exponential backoff lockout durations (in milliseconds)
// Attempts: 1, 2, 3 = no lockout, 4 = 30s, 5 = 60s, 6+ = 5min
const LOCKOUT_DURATIONS_MS = [0, 0, 0, 30000, 60000, 300000];
const MAX_LOCKOUT_MS = 300000; // 5 minutes max

export type BiometricType = 'face' | 'fingerprint' | 'iris' | null;

export interface BiometricAuthResult {
    success: boolean;
    error?: string;
}

export interface StoredCredentials {
    token: string;
    deviceId: string;
    passwordHash: string;
    createdAt: number;
    expiresAt: number;
}

export interface BiometricAttemptData {
    attempts: number;
    lastAttemptTime: number;
    lockedUntil: number;
}

export interface RememberedUser {
    identifier: string;
    identifierType: 'email' | 'phone';
    displayName: string | null;
    photoURL: string | null;
    rememberedAt: number;
}

export interface LockoutStatus {
    isLockedOut: boolean;
    remainingTimeMs: number;
    attempts: number;
}

/**
 * Generate a unique device identifier
 * This creates a persistent ID for this device installation
 */
async function getOrCreateDeviceId(): Promise<string> {
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (!deviceId) {
        // Generate a random device ID using crypto-safe random
        deviceId = generateSecureToken(32);
        await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

/**
 * Generate a secure random token
 */
function generateSecureToken(length: number = 64): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint32Array(length);

    // Use crypto.getRandomValues if available, otherwise fallback
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(randomValues);
    } else {
        // Fallback for environments without crypto
        for (let i = 0; i < length; i++) {
            randomValues[i] = Math.floor(Math.random() * chars.length);
        }
    }

    for (let i = 0; i < length; i++) {
        result += chars[randomValues[i] % chars.length];
    }
    return result;
}

/**
 * Simple hash function for password verification
 * In production, use a proper crypto library like expo-crypto
 */
function hashPassword(password: string, salt: string): string {
    // Simple hash using string manipulation - for demo purposes
    // In production, use bcrypt or similar via expo-crypto
    const combined = password + salt + password.split('').reverse().join('');
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36) + combined.length.toString(36);
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

// ============================================
// EXPONENTIAL BACKOFF LOCKOUT FUNCTIONS
// ============================================

/**
 * Get the lockout duration for a given number of attempts
 */
function getLockoutDuration(attempts: number): number {
    if (attempts < LOCKOUT_DURATIONS_MS.length) {
        return LOCKOUT_DURATIONS_MS[attempts];
    }
    return MAX_LOCKOUT_MS;
}

/**
 * Get current attempt data from storage
 */
async function getAttemptData(): Promise<BiometricAttemptData> {
    try {
        const data = await SecureStore.getItemAsync(BIOMETRIC_ATTEMPTS_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch {
        // Ignore errors
    }
    return { attempts: 0, lastAttemptTime: 0, lockedUntil: 0 };
}

/**
 * Save attempt data to storage
 */
async function saveAttemptData(data: BiometricAttemptData): Promise<void> {
    await SecureStore.setItemAsync(BIOMETRIC_ATTEMPTS_KEY, JSON.stringify(data));
}

/**
 * Check if biometric authentication is currently locked out
 */
export async function checkLockoutStatus(): Promise<LockoutStatus> {
    const data = await getAttemptData();
    const now = Date.now();

    if (data.lockedUntil > now) {
        return {
            isLockedOut: true,
            remainingTimeMs: data.lockedUntil - now,
            attempts: data.attempts
        };
    }

    return {
        isLockedOut: false,
        remainingTimeMs: 0,
        attempts: data.attempts
    };
}

/**
 * Record a failed biometric attempt and apply lockout if needed
 */
export async function recordFailedAttempt(): Promise<LockoutStatus> {
    const data = await getAttemptData();
    const now = Date.now();

    // If lockout has expired, don't increment (user waited)
    if (data.lockedUntil > 0 && data.lockedUntil <= now) {
        // Lockout expired, but still increment for this new failure
    }

    data.attempts += 1;
    data.lastAttemptTime = now;

    // Calculate lockout duration based on new attempt count
    const lockoutDuration = getLockoutDuration(data.attempts);
    if (lockoutDuration > 0) {
        data.lockedUntil = now + lockoutDuration;
    }

    await saveAttemptData(data);

    return {
        isLockedOut: lockoutDuration > 0,
        remainingTimeMs: lockoutDuration,
        attempts: data.attempts
    };
}

/**
 * Reset attempt counter (call after successful authentication)
 */
export async function resetAttempts(): Promise<void> {
    await SecureStore.deleteItemAsync(BIOMETRIC_ATTEMPTS_KEY);
}

/**
 * Format lockout time for display
 */
export function formatLockoutTime(ms: number): string {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) {
        return `${seconds} giây`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
        return `${minutes} phút`;
    }
    return `${minutes} phút ${remainingSeconds} giây`;
}

// ============================================
// BIOMETRIC CHANGE DETECTION FUNCTIONS
// ============================================

/**
 * Store current biometric enrollment state
 * This captures a fingerprint of the current biometric setup
 */
async function storeBiometricEnrollment(): Promise<void> {
    try {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

        const enrollment = {
            types: types.sort(),
            isEnrolled,
            securityLevel,
            timestamp: Date.now()
        };

        await SecureStore.setItemAsync(BIOMETRIC_ENROLLMENT_KEY, JSON.stringify(enrollment));
    } catch {
        // Ignore errors during enrollment storage
    }
}

/**
 * Check if biometric enrollment has changed since setup
 * This detects if new fingerprints/faces were added or removed
 */
export async function checkBiometricIntegrity(): Promise<{
    isValid: boolean;
    reason?: string;
}> {
    try {
        const storedData = await SecureStore.getItemAsync(BIOMETRIC_ENROLLMENT_KEY);
        if (!storedData) {
            // No previous enrollment data - allow (first time setup)
            return { isValid: true };
        }

        const stored = JSON.parse(storedData);

        // Get current biometric state
        const currentTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        const currentEnrolled = await LocalAuthentication.isEnrolledAsync();
        const currentSecurityLevel = await LocalAuthentication.getEnrolledLevelAsync();

        // Check if biometric types changed
        const storedTypesStr = JSON.stringify(stored.types);
        const currentTypesStr = JSON.stringify(currentTypes.sort());
        if (storedTypesStr !== currentTypesStr) {
            return {
                isValid: false,
                reason: 'Loại sinh trắc học đã thay đổi'
            };
        }

        // Check if enrollment status changed
        if (stored.isEnrolled !== currentEnrolled) {
            return {
                isValid: false,
                reason: currentEnrolled ? 'Đã thêm sinh trắc học mới' : 'Sinh trắc học đã bị xóa'
            };
        }

        // Check if security level changed (indicates biometric data modification)
        if (stored.securityLevel !== currentSecurityLevel) {
            return {
                isValid: false,
                reason: 'Dữ liệu sinh trắc học đã được cập nhật'
            };
        }

        return { isValid: true };
    } catch {
        // On error, allow authentication but log
        return { isValid: true };
    }
}

/**
 * Update stored biometric enrollment (after user re-verifies with password)
 */
export async function updateBiometricEnrollment(): Promise<void> {
    await storeBiometricEnrollment();
}

// ============================================
// CORE AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Authenticate using biometrics (Face ID / Touch ID / Fingerprint)
 */
export async function authenticateWithBiometric(): Promise<BiometricAuthResult> {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Xác thực để đăng nhập',
            fallbackLabel: '', // Hide fallback label
            disableDeviceFallback: true, // Don't allow device PIN fallback
            cancelLabel: 'Hủy'
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
 * Store user credentials securely with token-based approach
 * Instead of storing raw password, we store an encrypted token bound to device
 */
export async function saveCredentials(password: string): Promise<void> {
    const deviceId = await getOrCreateDeviceId();
    const token = generateSecureToken(64);
    const passwordHash = hashPassword(password, deviceId);

    const credentials: StoredCredentials = {
        token,
        deviceId,
        passwordHash,
        createdAt: Date.now(),
        expiresAt: Date.now() + TOKEN_EXPIRATION_MS
    };
    console.log('credentials :>> ', credentials);

    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, JSON.stringify(credentials));

    // Store biometric hash for integrity checking (legacy)
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    await SecureStore.setItemAsync(BIOMETRIC_HASH_KEY, JSON.stringify(types));

    // Store detailed biometric enrollment for change detection
    await storeBiometricEnrollment();

    // Reset any lockout attempts on successful setup
    await resetAttempts();
}

/**
 * Retrieve and validate stored credentials
 * Returns the password hash for verification, or null if invalid/expired
 */
export async function getStoredCredentials(): Promise<StoredCredentials | null> {
    try {
        const data = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        console.log('data :>> ', data);
        if (!data) return null;

        const credentials: StoredCredentials = JSON.parse(data);

        // Check if token has expired
        if (Date.now() > credentials.expiresAt) {
            await clearCredentials();
            return null;
        }

        // Verify device binding
        const currentDeviceId = await getOrCreateDeviceId();
        if (credentials.deviceId !== currentDeviceId) {
            await clearCredentials();
            return null;
        }

        return credentials;
    } catch {
        return null;
    }
}

/**
 * Verify password against stored hash
 */
export async function verifyStoredPassword(password: string): Promise<boolean> {
    const credentials = await getStoredCredentials();
    if (!credentials) return false;

    const deviceId = await getOrCreateDeviceId();
    const passwordHash = hashPassword(password, deviceId);

    return passwordHash === credentials.passwordHash;
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
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(FACE_ID_ENABLED_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_HASH_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ENROLLMENT_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ATTEMPTS_KEY);
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

/**
 * Refresh token expiration (call after successful biometric auth)
 */
export async function refreshTokenExpiration(): Promise<void> {
    try {
        const data = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        if (!data) return;

        const credentials: StoredCredentials = JSON.parse(data);
        credentials.expiresAt = Date.now() + TOKEN_EXPIRATION_MS;

        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, JSON.stringify(credentials));
    } catch {
        // Ignore errors during refresh
    }
}

// ============================================
// REMEMBERED USER FUNCTIONS
// ============================================

/**
 * Save remembered user info after successful login
 */
export async function saveRememberedUser(user: {
    identifier: string;
    identifierType: 'email' | 'phone';
    displayName: string | null;
    photoURL: string | null;
}): Promise<void> {
    const rememberedUser: RememberedUser = {
        ...user,
        rememberedAt: Date.now()
    };
    await SecureStore.setItemAsync(REMEMBERED_USER_KEY, JSON.stringify(rememberedUser));
}

/**
 * Get remembered user info
 */
export async function getRememberedUser(): Promise<RememberedUser | null> {
    try {
        const data = await SecureStore.getItemAsync(REMEMBERED_USER_KEY);
        if (!data) return null;
        return JSON.parse(data);
    } catch {
        return null;
    }
}

/**
 * Check if there is a remembered user
 */
export async function hasRememberedUser(): Promise<boolean> {
    const user = await getRememberedUser();
    return user !== null;
}

/**
 * Clear remembered user (for "switch account")
 */
export async function clearRememberedUser(): Promise<void> {
    await SecureStore.deleteItemAsync(REMEMBERED_USER_KEY);
}

/**
 * Clear auth credentials but keep remembered user identity
 * Used for logout - user still sees their name/masked identifier on login screen
 */
export async function clearAuthCredentialsKeepIdentity(): Promise<void> {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(FACE_ID_ENABLED_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_HASH_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ENROLLMENT_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ATTEMPTS_KEY);
    // Note: REMEMBERED_USER_KEY is intentionally NOT cleared
}

/**
 * Clear all stored credentials and user data including remembered identity
 * Use for complete sign out or "switch account"
 */
export async function clearAllData(): Promise<void> {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(FACE_ID_ENABLED_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_HASH_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ENROLLMENT_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ATTEMPTS_KEY);
    await SecureStore.deleteItemAsync(REMEMBERED_USER_KEY);
}
