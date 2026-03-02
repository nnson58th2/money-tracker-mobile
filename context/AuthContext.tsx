import {
    AuthUser,
    checkPhoneExists,
    createUserDocument,
    signOut as firebaseSignOut,
    getCurrentUser,
    getIdToken,
    onAuthStateChange,
    reauthenticateWithPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmail,
    signUpWithEmail,
    updateUserProfile
} from '@/services/authService';
import { router, useRootNavigationState, useSegments } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import * as BiometricAuth from '../services/biometricAuth';

// State type for useReducer
type AuthState = {
    isAuthenticated: boolean;
    isFaceIdEnabled: boolean;
    isBiometricAvailable: boolean;
    biometricType: BiometricAuth.BiometricType;
    lockoutStatus: BiometricAuth.LockoutStatus | null;
    // Firebase user state
    user: AuthUser | null;
    isLoading: boolean;
    authError: string | null;
    authMethod: 'email' | 'phone' | 'biometric' | null;
    // Remembered user state
    rememberedUser: BiometricAuth.RememberedUser | null;
    isReturningUser: boolean;
};

// Action types for the reducer
type AuthAction =
    | { type: 'LOGIN' }
    | { type: 'LOGOUT' }
    | { type: 'SET_FACE_ID_ENABLED'; payload: boolean }
    | { type: 'SET_BIOMETRIC_STATUS'; payload: { available: boolean; type: BiometricAuth.BiometricType; enabled: boolean } }
    | { type: 'SET_LOCKOUT_STATUS'; payload: BiometricAuth.LockoutStatus | null }
    | { type: 'SET_USER'; payload: AuthUser | null }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_AUTH_ERROR'; payload: string | null }
    | { type: 'SET_AUTH_METHOD'; payload: 'email' | 'phone' | 'biometric' | null }
    | { type: 'AUTH_STATE_CHANGED'; payload: { user: AuthUser | null } }
    | { type: 'SET_REMEMBERED_USER'; payload: BiometricAuth.RememberedUser | null }
    | { type: 'CLEAR_REMEMBERED_USER' };

// Initial state
const initialState: AuthState = {
    isAuthenticated: false,
    isFaceIdEnabled: false,
    isBiometricAvailable: false,
    biometricType: null,
    lockoutStatus: null,
    // Firebase
    user: null,
    isLoading: true, // Start true for initial auth check
    authError: null,
    authMethod: null,
    // Remembered user
    rememberedUser: null,
    isReturningUser: false
};

// Reducer function for better state management and performance
function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'LOGIN':
            return { ...state, isAuthenticated: true, lockoutStatus: null };
        case 'LOGOUT':
            return { ...state, isAuthenticated: false, user: null, authMethod: null };
        case 'SET_FACE_ID_ENABLED':
            return { ...state, isFaceIdEnabled: action.payload };
        case 'SET_BIOMETRIC_STATUS':
            return {
                ...state,
                isBiometricAvailable: action.payload.available,
                biometricType: action.payload.type,
                isFaceIdEnabled: action.payload.enabled
            };
        case 'SET_LOCKOUT_STATUS':
            return { ...state, lockoutStatus: action.payload };
        case 'SET_USER':
            return { ...state, user: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_AUTH_ERROR':
            return { ...state, authError: action.payload };
        case 'SET_AUTH_METHOD':
            return { ...state, authMethod: action.payload };
        case 'AUTH_STATE_CHANGED':
            return {
                ...state,
                user: action.payload.user,
                isLoading: false
            };
        case 'SET_REMEMBERED_USER':
            return {
                ...state,
                rememberedUser: action.payload,
                isReturningUser: action.payload !== null
            };
        case 'CLEAR_REMEMBERED_USER':
            return {
                ...state,
                rememberedUser: null,
                isReturningUser: false
            };
        default:
            return state;
    }
}

type AuthContextType = {
    isAuthenticated: boolean;
    lockoutStatus: BiometricAuth.LockoutStatus | null;
    // Firebase user
    user: AuthUser | null;
    isLoading: boolean;
    authError: string | null;
    authMethod: 'email' | 'phone' | 'biometric' | null;
    // Auth actions
    login: (identifier: string, password: string) => Promise<boolean>;
    register: (data: { email: string; phone: string; password: string; displayName: string }) => Promise<boolean>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
    clearError: () => void;
    // Face ID related
    isFaceIdEnabled: boolean;
    isBiometricAvailable: boolean;
    biometricType: BiometricAuth.BiometricType;
    enableFaceId: (password: string) => Promise<boolean>;
    disableFaceId: () => Promise<void>;
    loginWithFaceId: () => Promise<{ success: boolean; error?: string; integrityError?: string }>;
    checkBiometricStatus: () => Promise<void>;
    checkLockoutStatus: () => Promise<BiometricAuth.LockoutStatus>;
    clearLockout: () => Promise<void>;
    // Remembered user
    rememberedUser: BiometricAuth.RememberedUser | null;
    isReturningUser: boolean;
    clearRememberedUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    lockoutStatus: null,
    user: null,
    isLoading: true,
    authError: null,
    authMethod: null,
    login: async () => false,
    register: async () => false,
    logout: async () => {},
    resetPassword: async () => ({ success: false }),
    clearError: () => {},
    // Face ID defaults
    isFaceIdEnabled: false,
    isBiometricAvailable: false,
    biometricType: null,
    enableFaceId: async () => false,
    disableFaceId: async () => {},
    loginWithFaceId: async () => ({ success: false }),
    checkBiometricStatus: async () => {},
    checkLockoutStatus: async () => ({ isLockedOut: false, remainingTimeMs: 0, attempts: 0 }),
    clearLockout: async () => {},
    // Remembered user defaults
    rememberedUser: null,
    isReturningUser: false,
    clearRememberedUser: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const segments = useSegments();

    // Load remembered user on mount
    useEffect(() => {
        const loadRememberedUser = async () => {
            const remembered = await BiometricAuth.getRememberedUser();
            dispatch({ type: 'SET_REMEMBERED_USER', payload: remembered });
        };
        loadRememberedUser();
    }, []);

    // Firebase auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            dispatch({
                type: 'AUTH_STATE_CHANGED',
                payload: { user }
            });
            // If user is logged in via Firebase, set authenticated
            if (user) {
                dispatch({ type: 'LOGIN' });
            }
        });

        return unsubscribe;
    }, []);

    // Login with email/phone and password
    const login = useCallback(async (identifier: string, password: string): Promise<boolean> => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_AUTH_ERROR', payload: null });

        try {
            // Determine if identifier is email or phone
            const isEmail = identifier.includes('@');
            let loginEmail = identifier.trim();

            if (!isEmail) {
                // Phone login - lookup email by phone number
                const { lookupEmailByPhone } = await import('@/services/authService');
                const emailResult = await lookupEmailByPhone(identifier.trim());
                if (!emailResult) {
                    dispatch({ type: 'SET_AUTH_ERROR', payload: 'Không tìm thấy tài khoản với số điện thoại này' });
                    dispatch({ type: 'SET_LOADING', payload: false });
                    return false;
                }
                loginEmail = emailResult;
            }

            const result = await signInWithEmail(loginEmail, password);

            if (result.success && result.user) {
                dispatch({ type: 'SET_USER', payload: result.user });
                dispatch({ type: 'SET_AUTH_METHOD', payload: isEmail ? 'email' : 'phone' });

                // Save remembered user for returning user experience
                const rememberedUserData = {
                    identifier: identifier.trim(),
                    identifierType: isEmail ? ('email' as const) : ('phone' as const),
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL
                };
                await BiometricAuth.saveRememberedUser(rememberedUserData);
                dispatch({ type: 'SET_REMEMBERED_USER', payload: { ...rememberedUserData, rememberedAt: Date.now() } });

                // Clear any existing lockout
                await BiometricAuth.resetAttempts();

                dispatch({ type: 'LOGIN' });
                dispatch({ type: 'SET_LOADING', payload: false });

                return true;
            } else {
                dispatch({ type: 'SET_AUTH_ERROR', payload: result.error || 'Đăng nhập thất bại' });
                dispatch({ type: 'SET_LOADING', payload: false });
                return false;
            }
        } catch (error: any) {
            dispatch({ type: 'SET_AUTH_ERROR', payload: error.message || 'Đã xảy ra lỗi' });
            dispatch({ type: 'SET_LOADING', payload: false });
            return false;
        }
    }, []);

    // Register new user
    const register = useCallback(async (data: { email: string; phone: string; password: string; displayName: string }): Promise<boolean> => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_AUTH_ERROR', payload: null });

        try {
            // Check if phone already exists
            const phoneExists = await checkPhoneExists(data.phone);
            if (phoneExists) {
                dispatch({ type: 'SET_AUTH_ERROR', payload: 'Số điện thoại này đã được đăng ký' });
                dispatch({ type: 'SET_LOADING', payload: false });
                return false;
            }

            // Create Firebase user
            const result = await signUpWithEmail(data.email, data.password);

            if (!result.success || !result.user) {
                dispatch({ type: 'SET_AUTH_ERROR', payload: result.error || 'Đăng ký thất bại' });
                dispatch({ type: 'SET_LOADING', payload: false });
                return false;
            }

            // Update display name
            await updateUserProfile(data.displayName);

            // Send email verification
            await sendEmailVerification();

            // Create user document in Firestore
            await createUserDocument(result.user.uid, {
                email: data.email,
                phone: data.phone,
                displayName: data.displayName
            });

            // Sign out - require email verification
            await firebaseSignOut();

            dispatch({ type: 'SET_LOADING', payload: false });
            return true;
        } catch (error: any) {
            dispatch({ type: 'SET_AUTH_ERROR', payload: error.message || 'Đăng ký thất bại' });
            dispatch({ type: 'SET_LOADING', payload: false });
            return false;
        }
    }, []);

    // Logout - keeps remembered user identity for returning user experience
    const logout = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            await firebaseSignOut();
            // Clear biometric credentials but keep remembered user identity
            await BiometricAuth.clearAuthCredentialsKeepIdentity();
        } catch (error) {
            console.error('Logout error:', error);
        }

        dispatch({ type: 'LOGOUT' });
        dispatch({ type: 'SET_USER', payload: null });
        dispatch({ type: 'SET_AUTH_METHOD', payload: null });
        dispatch({ type: 'SET_LOADING', payload: false });
    }, []);

    // Clear remembered user (for "switch account" functionality)
    const clearRememberedUser = useCallback(async () => {
        await BiometricAuth.clearRememberedUser();
        dispatch({ type: 'CLEAR_REMEMBERED_USER' });
    }, []);

    // Password reset
    const resetPassword = useCallback(async (email: string) => {
        return await sendPasswordResetEmail(email);
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        dispatch({ type: 'SET_AUTH_ERROR', payload: null });
    }, []);

    // Check biometric availability and Face ID status
    const checkBiometricStatus = useCallback(async () => {
        const hasHardware = await BiometricAuth.isBiometricAvailable();
        const isEnrolled = await BiometricAuth.isBiometricEnrolled();
        const type = await BiometricAuth.getBiometricType();
        const enabled = await BiometricAuth.isFaceIdEnabled();

        dispatch({
            type: 'SET_BIOMETRIC_STATUS',
            payload: {
                available: hasHardware && isEnrolled,
                type,
                enabled
            }
        });

        // Also check lockout status
        const lockout = await BiometricAuth.checkLockoutStatus();
        dispatch({ type: 'SET_LOCKOUT_STATUS', payload: lockout.isLockedOut ? lockout : null });
    }, []);

    // Check current lockout status
    const checkLockoutStatus = useCallback(async (): Promise<BiometricAuth.LockoutStatus> => {
        const status = await BiometricAuth.checkLockoutStatus();
        dispatch({ type: 'SET_LOCKOUT_STATUS', payload: status.isLockedOut ? status : null });
        return status;
    }, []);

    // Clear lockout after successful password login
    const clearLockout = useCallback(async () => {
        await BiometricAuth.resetAttempts();
        dispatch({ type: 'SET_LOCKOUT_STATUS', payload: null });
    }, []);

    // Enable Face ID and store credentials
    const enableFaceId = useCallback(
        async (password: string): Promise<boolean> => {
            try {
                // Verify user is logged in
                const currentUser = getCurrentUser();
                if (!currentUser) {
                    return false;
                }

                // Re-authenticate to confirm password
                const reauth = await reauthenticateWithPassword(password);
                if (!reauth.success) {
                    return false;
                }

                // Save credentials with user ID
                await BiometricAuth.saveCredentials(password);
                await BiometricAuth.setFaceIdEnabled(true);
                dispatch({ type: 'SET_FACE_ID_ENABLED', payload: true });

                // Clear any existing lockout
                await clearLockout();

                return true;
            } catch {
                return false;
            }
        },
        [clearLockout]
    );

    // Disable Face ID and clear credentials
    const disableFaceId = useCallback(async () => {
        await BiometricAuth.clearCredentials();
        dispatch({ type: 'SET_FACE_ID_ENABLED', payload: false });
        dispatch({ type: 'SET_LOCKOUT_STATUS', payload: null });
    }, []);

    // Login using Face ID with lockout and integrity checks
    const loginWithFaceId = useCallback(async (): Promise<{
        success: boolean;
        error?: string;
        integrityError?: string;
    }> => {
        // Check if currently locked out
        const lockout = await BiometricAuth.checkLockoutStatus();
        if (lockout.isLockedOut) {
            dispatch({ type: 'SET_LOCKOUT_STATUS', payload: lockout });
            return {
                success: false,
                error: `Vui lòng đợi ${BiometricAuth.formatLockoutTime(lockout.remainingTimeMs)} trước khi thử lại`
            };
        }

        // Check biometric integrity (detect if fingerprints/faces changed)
        const integrity = await BiometricAuth.checkBiometricIntegrity();
        if (!integrity.isValid) {
            // Biometric data changed - require password re-verification
            await disableFaceId();
            return {
                success: false,
                error: 'Vui lòng đăng nhập lại bằng mật khẩu.',
                integrityError: integrity.reason
            };
        }

        // Verify credentials exist and are valid
        const credentials = await BiometricAuth.getStoredCredentials();
        if (!credentials) {
            // Credentials missing or expired
            await disableFaceId();
            return {
                success: false,
                error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại bằng mật khẩu.'
            };
        }

        // Check Firebase session is still valid
        const token = await getIdToken();
        if (!token) {
            // Firebase session expired
            await disableFaceId();
            return {
                success: false,
                error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại bằng mật khẩu.'
            };
        }

        // Authenticate with biometrics
        const authResult = await BiometricAuth.authenticateWithBiometric();

        if (!authResult.success) {
            // Record failed attempt for exponential backoff
            // Don't count user cancellation as a failed attempt
            if (authResult.error !== 'Đã hủy xác thực') {
                const newLockout = await BiometricAuth.recordFailedAttempt();
                dispatch({ type: 'SET_LOCKOUT_STATUS', payload: newLockout.isLockedOut ? newLockout : null });

                if (newLockout.isLockedOut) {
                    return {
                        success: false,
                        error: `Quá nhiều lần thử thất bại. Vui lòng đợi ${BiometricAuth.formatLockoutTime(newLockout.remainingTimeMs)}`
                    };
                }
            }

            return { success: false, error: authResult.error };
        }

        // Biometric auth successful - reset attempts, refresh token
        await BiometricAuth.resetAttempts();
        await BiometricAuth.refreshTokenExpiration();
        dispatch({ type: 'SET_LOCKOUT_STATUS', payload: null });

        // Get current user from Firebase
        const currentUser = getCurrentUser();
        if (currentUser) {
            dispatch({ type: 'SET_USER', payload: currentUser });
            dispatch({ type: 'SET_AUTH_METHOD', payload: 'biometric' });
        }

        dispatch({ type: 'LOGIN' });

        return { success: true };
    }, [disableFaceId]);

    // Check biometric status on mount
    useEffect(() => {
        checkBiometricStatus();
    }, [checkBiometricStatus]);

    const rootNavigationState = useRootNavigationState();

    // Navigation effect
    useEffect(() => {
        if (!rootNavigationState?.key) return;
        if (state.isLoading) return;

        const inAuthGroup = segments[0] === '(tabs)';
        const inLoginScreen = segments[0] === 'login';
        const inRegisterScreen = segments[0] === 'register';

        // Redirect to login if not authenticated and trying to access protected routes
        if (!state.isAuthenticated && inAuthGroup) {
            setTimeout(() => {
                router.replace('/login');
            }, 0);
            return;
        }

        // Redirect to tabs if authenticated and on login/register screen
        if (state.isAuthenticated && (inLoginScreen || inRegisterScreen)) {
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 0);
        }
    }, [state.isAuthenticated, state.isLoading, segments, rootNavigationState]);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo(
        () => ({
            isAuthenticated: state.isAuthenticated,
            lockoutStatus: state.lockoutStatus,
            user: state.user,
            isLoading: state.isLoading,
            authError: state.authError,
            authMethod: state.authMethod,
            login,
            register,
            logout,
            resetPassword,
            clearError,
            isFaceIdEnabled: state.isFaceIdEnabled,
            isBiometricAvailable: state.isBiometricAvailable,
            biometricType: state.biometricType,
            enableFaceId,
            disableFaceId,
            loginWithFaceId,
            checkBiometricStatus,
            checkLockoutStatus,
            clearLockout,
            // Remembered user
            rememberedUser: state.rememberedUser,
            isReturningUser: state.isReturningUser,
            clearRememberedUser
        }),
        [
            state.isAuthenticated,
            state.lockoutStatus,
            state.user,
            state.isLoading,
            state.authError,
            state.authMethod,
            state.isFaceIdEnabled,
            state.isBiometricAvailable,
            state.biometricType,
            state.rememberedUser,
            state.isReturningUser,
            login,
            register,
            logout,
            resetPassword,
            clearError,
            enableFaceId,
            disableFaceId,
            loginWithFaceId,
            checkBiometricStatus,
            checkLockoutStatus,
            clearLockout,
            clearRememberedUser
        ]
    );

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
