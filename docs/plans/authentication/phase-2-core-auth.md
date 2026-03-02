# Phase 2: Core Auth - Firebase Login/Register Integration

## Objective
Integrate Firebase authentication into the existing AuthContext and update login/register screens.

## Prerequisites
- [ ] Phase 1 completed and verified
- [ ] Firebase project configured with email/password provider enabled
- [ ] App starts without errors

---

## Files to Modify

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `context/AuthContext.tsx` | Modify | Add Firebase integration, new state/actions |
| 2 | `app/login.tsx` | Modify | Add email input, Firebase login |
| 3 | `app/register.tsx` | Modify | Complete registration with Firebase |
| 4 | `services/biometricAuth.ts` | Modify | Integrate with Firebase token |

---

## Step 1: Refactor AuthContext.tsx

### Location
`/Users/sonnguyen/dev/projects/money-tracker-mobile/context/AuthContext.tsx`

### Current State (to preserve)
- `isAuthenticated`, `isFaceIdEnabled`, `isBiometricAvailable`
- `biometricType`, `lockoutStatus`
- Biometric login flow with lockout and integrity checks

### New State Fields to Add
```typescript
// Add to AuthState type
user: AuthUser | null;           // Firebase user info
isLoading: boolean;              // Loading state for async ops
authError: string | null;        // Error message display
authMethod: 'email' | 'phone' | null;  // How user authenticated

// For Phase 3 (2FA) - add now for future
isMfaEnabled: boolean;
isMfaVerified: boolean;
mfaPending: boolean;
```

### New Actions to Add
```typescript
// Add to AuthAction type
| { type: 'SET_USER'; payload: AuthUser | null }
| { type: 'SET_LOADING'; payload: boolean }
| { type: 'SET_AUTH_ERROR'; payload: string | null }
| { type: 'SET_AUTH_METHOD'; payload: 'email' | 'phone' | null }
| { type: 'AUTH_STATE_CHANGED'; payload: { user: AuthUser | null } }

// For Phase 3
| { type: 'SET_MFA_STATUS'; payload: { enabled: boolean; verified: boolean; pending: boolean } }
```

### Implementation Changes

#### 1. Add imports
```typescript
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as firebaseSignOut,
  onAuthStateChange,
  getCurrentUser,
  getIdToken,
  AuthUser,
  reauthenticateWithPassword,
  sendPasswordResetEmail,
} from '@/services/authService';
```

#### 2. Update initial state
```typescript
const initialState: AuthState = {
  // Existing
  isAuthenticated: false,
  isFaceIdEnabled: false,
  isBiometricAvailable: false,
  biometricType: null,
  lockoutStatus: null,

  // New
  user: null,
  isLoading: true,  // Start true for initial auth check
  authError: null,
  authMethod: null,

  // Phase 3 prep
  isMfaEnabled: false,
  isMfaVerified: false,
  mfaPending: false,
};
```

#### 3. Update reducer
```typescript
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    // Existing cases...

    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: action.payload !== null,
      };

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
        isAuthenticated: action.payload.user !== null,
        isLoading: false,
      };

    case 'SET_MFA_STATUS':
      return {
        ...state,
        isMfaEnabled: action.payload.enabled,
        isMfaVerified: action.payload.verified,
        mfaPending: action.payload.pending,
      };

    default:
      return state;
  }
}
```

#### 4. Add Firebase auth state listener
```typescript
// Inside AuthProvider, add useEffect
useEffect(() => {
  const unsubscribe = onAuthStateChange((user) => {
    dispatch({
      type: 'AUTH_STATE_CHANGED',
      payload: { user },
    });
  });

  return unsubscribe;
}, []);
```

#### 5. Update login function
```typescript
// Replace existing login function
const login = useCallback(async (email: string, password: string): Promise<boolean> => {
  dispatch({ type: 'SET_LOADING', payload: true });
  dispatch({ type: 'SET_AUTH_ERROR', payload: null });

  const result = await signInWithEmail(email, password);

  if (result.success && result.user) {
    dispatch({ type: 'SET_USER', payload: result.user });
    dispatch({ type: 'SET_AUTH_METHOD', payload: 'email' });
    dispatch({ type: 'SET_LOADING', payload: false });

    // Clear biometric lockout on successful login
    await clearLockout();

    return true;
  } else {
    dispatch({ type: 'SET_AUTH_ERROR', payload: result.error || 'Login failed' });
    dispatch({ type: 'SET_LOADING', payload: false });
    return false;
  }
}, [clearLockout]);
```

#### 6. Add register function
```typescript
const register = useCallback(async (
  email: string,
  password: string,
  displayName?: string
): Promise<boolean> => {
  dispatch({ type: 'SET_LOADING', payload: true });
  dispatch({ type: 'SET_AUTH_ERROR', payload: null });

  const result = await signUpWithEmail(email, password);

  if (result.success) {
    // Update display name if provided
    if (displayName) {
      await updateUserProfile(displayName);
    }
    dispatch({ type: 'SET_LOADING', payload: false });
    return true;
  } else {
    dispatch({ type: 'SET_AUTH_ERROR', payload: result.error || 'Registration failed' });
    dispatch({ type: 'SET_LOADING', payload: false });
    return false;
  }
}, []);
```

#### 7. Update logout function
```typescript
const logout = useCallback(async () => {
  dispatch({ type: 'SET_LOADING', payload: true });

  try {
    await firebaseSignOut();
  } catch (error) {
    console.error('Logout error:', error);
  }

  // Clear local state
  dispatch({ type: 'LOGOUT' });
  dispatch({ type: 'SET_USER', payload: null });
  dispatch({ type: 'SET_AUTH_METHOD', payload: null });
  dispatch({ type: 'SET_LOADING', payload: false });
}, []);
```

#### 8. Update loginWithFaceId
```typescript
const loginWithFaceId = useCallback(async (): Promise<{
  success: boolean;
  error?: string;
  integrityError?: string;
}> => {
  // Existing lockout and integrity checks...

  // NEW: Verify Firebase session is still valid
  const token = await getIdToken();
  if (!token) {
    return {
      success: false,
      error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại bằng mật khẩu.',
    };
  }

  // Continue with existing biometric authentication...
  // On success, also refresh the token
  const result = await BiometricAuth.authenticateWithBiometric();

  if (result.success) {
    await BiometricAuth.refreshTokenExpiration();
    dispatch({ type: 'LOGIN' });

    // Get current user from Firebase
    const currentUser = getCurrentUser();
    if (currentUser) {
      dispatch({ type: 'SET_USER', payload: currentUser });
    }

    return { success: true };
  }

  // Existing error handling...
}, [/* existing deps */]);
```

#### 9. Update context value
```typescript
const value = {
  // Existing
  ...state,
  login,
  logout,
  loginWithFaceId,
  enableFaceId,
  disableFaceId,
  checkBiometricStatus,
  checkLockoutStatus,
  clearLockout,

  // New
  register,
  resetPassword: sendPasswordResetEmail,
  reauthenticate: reauthenticateWithPassword,
  clearError: () => dispatch({ type: 'SET_AUTH_ERROR', payload: null }),
};
```

### Verification
- [ ] TypeScript compiles without errors
- [ ] Existing biometric flow still works
- [ ] New state fields are accessible in components

---

## Step 2: Update login.tsx

### Location
`/Users/sonnguyen/dev/projects/money-tracker-mobile/app/login.tsx`

### Changes Required

#### 1. Add identifier state (email OR phone)
```typescript
// Add to existing state
const [identifier, setIdentifier] = useState(''); // Can be email or phone
const [identifierType, setIdentifierType] = useState<'email' | 'phone' | null>(null);

// Auto-detect input type
useEffect(() => {
  if (identifier.includes('@')) {
    setIdentifierType('email');
  } else if (/^\d+$/.test(identifier) && identifier.length >= 9) {
    setIdentifierType('phone');
  } else {
    setIdentifierType(null);
  }
}, [identifier]);
```

#### 2. Add unified identifier input field
Insert before password input (around line 281):
```typescript
{/* Email/Phone Input */}
<XStack
  backgroundColor="$colorBox"
  paddingHorizontal={20}
  paddingVertical={16}
  alignItems="center"
  gap={12}
  borderRadius={16}
  marginBottom={12}
>
  <Ionicons
    name={identifierType === 'phone' ? 'call-outline' : 'mail-outline'}
    size={24}
    color={theme.tertiary?.val}
  />
  <Input
    flex={1}
    backgroundColor="transparent"
    borderWidth={0}
    placeholder="Email hoặc số điện thoại"
    placeholderTextColor={theme.tertiary?.val}
    value={identifier}
    onChangeText={setIdentifier}
    keyboardType="email-address"
    autoCapitalize="none"
    autoComplete="email"
    color="$color"
    fontSize={16}
  />
  {identifierType && (
    <Text color="$tertiary" fontSize={12}>
      {identifierType === 'email' ? 'Email' : 'SĐT'}
    </Text>
  )}
</XStack>
```

#### 3. Update handleLogin
```typescript
const handleLogin = async () => {
  // Validate inputs
  if (!identifier.trim()) {
    Alert.alert('Lỗi', 'Vui lòng nhập email hoặc số điện thoại');
    return;
  }
  if (!identifierType) {
    Alert.alert('Lỗi', 'Vui lòng nhập email hoặc số điện thoại hợp lệ');
    return;
  }
  if (!password.trim()) {
    Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu');
    return;
  }

  setIsLoading(true);

  // For phone login, lookup email by phone number first
  let loginEmail = identifier.trim();
  if (identifierType === 'phone') {
    // Lookup email from Firestore by phone number
    const emailResult = await lookupEmailByPhone(identifier.trim());
    if (!emailResult) {
      Alert.alert('Lỗi', 'Không tìm thấy tài khoản với số điện thoại này');
      setIsLoading(false);
      return;
    }
    loginEmail = emailResult;
  }

  const success = await login(loginEmail, password);

  if (success) {
    // Check if Face ID should be enabled
    if (isBiometricAvailable && !isFaceIdEnabled) {
      Alert.alert(
        'Bật Face ID?',
        'Bạn có muốn sử dụng Face ID để đăng nhập nhanh hơn không?',
        [
          { text: 'Không', style: 'cancel' },
          {
            text: 'Bật',
            onPress: async () => {
              await enableFaceId(password);
            },
          },
        ]
      );
    }
    // Navigation handled by AuthContext
  } else {
    // Error displayed via authError state
    if (authError) {
      Alert.alert('Đăng nhập thất bại', authError);
    }
  }

  setIsLoading(false);
};

// Helper function to lookup email by phone (add to authService.ts)
async function lookupEmailByPhone(phone: string): Promise<string | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', phone));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;
    return snapshot.docs[0].data().email;
  } catch (error) {
    console.error('Phone lookup error:', error);
    return null;
  }
}
```

#### 4. Add error display
Display authError from context:
```typescript
{authError && (
  <Text color="$red10" textAlign="center" marginBottom={12}>
    {authError}
  </Text>
)}
```

#### 5. Implement forgot password — navigate to dedicated screen

Instead of using `Alert.prompt()` (iOS-only), navigate to a dedicated screen:

```typescript
// In login.tsx
const handleForgotPassword = () => {
    const params = identifier.trim() ? `?identifier=${encodeURIComponent(identifier.trim())}` : '';
    router.push(`/forgot-password${params}`);
};
```

See `app/forgot-password.tsx` for the full dedicated screen implementation which handles:
- Email and phone number input (phone → lookupEmailByPhone → send reset)
- Inline validation and error display
- Loading and success states
- "Quay lại đăng nhập" back navigation

### Verification
- [ ] Email input displays correctly
- [ ] Login with valid Firebase credentials works
- [ ] Error messages display in Vietnamese
- [ ] Forgot password sends email
- [ ] Biometric prompt still works after Firebase login

---

## Step 3: Complete register.tsx

### Location
`/Users/sonnguyen/dev/projects/money-tracker-mobile/app/register.tsx`

### Current State
Form exists but has no actual registration logic (line 210-218 just navigates to login).

### Requirements
- **Both email AND phone required** during registration
- **Verification via email** (free, no SMS cost)
- Store phone in Firestore for login lookup

### Implementation

#### 1. Add validation functions
```typescript
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  // Vietnamese phone format: 10 digits starting with 0
  const phoneRegex = /^0\d{9}$/;
  return phoneRegex.test(phone);
};

const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 8) {
    return { valid: false, error: 'Mật khẩu phải có ít nhất 8 ký tự' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Mật khẩu phải có ít nhất 1 chữ hoa' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Mật khẩu phải có ít nhất 1 chữ thường' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Mật khẩu phải có ít nhất 1 số' };
  }
  return { valid: true };
};
```

#### 2. Implement handleRegister (with both email + phone)
```typescript
const handleRegister = async () => {
  // Clear previous errors
  clearError();

  // Validate name
  if (!formData.name.trim()) {
    Alert.alert('Lỗi', 'Vui lòng nhập tên');
    return;
  }

  // Validate email (REQUIRED)
  if (!validateEmail(formData.email)) {
    Alert.alert('Lỗi', 'Email không hợp lệ');
    return;
  }

  // Validate phone (REQUIRED)
  if (!validatePhone(formData.phone)) {
    Alert.alert('Lỗi', 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)');
    return;
  }

  // Check if phone already registered
  const phoneExists = await checkPhoneExists(formData.phone);
  if (phoneExists) {
    Alert.alert('Lỗi', 'Số điện thoại này đã được đăng ký');
    return;
  }

  // Validate password
  const passwordCheck = validatePassword(formData.password);
  if (!passwordCheck.valid) {
    Alert.alert('Lỗi', passwordCheck.error);
    return;
  }

  // Check password match
  if (formData.password !== formData.confirmPassword) {
    Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
    return;
  }

  // Check terms accepted
  if (!formData.acceptTerms) {
    Alert.alert('Lỗi', 'Vui lòng đồng ý với điều khoản sử dụng');
    return;
  }

  setIsLoading(true);

  try {
    // 1. Create Firebase user with email
    const result = await signUpWithEmail(formData.email.trim(), formData.password);

    if (!result.success || !result.user) {
      throw new Error(result.error || 'Registration failed');
    }

    // 2. Send email verification
    await sendEmailVerification(auth.currentUser!);

    // 3. Update profile with name
    await updateProfile(auth.currentUser!, { displayName: formData.name.trim() });

    // 4. Store user data in Firestore (including phone for lookup)
    await setDoc(doc(db, 'users', result.user.uid), {
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      displayName: formData.name.trim(),
      createdAt: serverTimestamp(),
      emailVerified: false,
    });

    // Sign out (require email verification before login)
    await signOut(auth);

    Alert.alert(
      'Xác nhận email',
      'Chúng tôi đã gửi email xác nhận. Vui lòng kiểm tra hộp thư và nhấn link xác nhận trước khi đăng nhập.',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/login'),
        },
      ]
    );
  } catch (error: any) {
    Alert.alert('Đăng ký thất bại', error.message || 'Đã xảy ra lỗi');
  }

  setIsLoading(false);
};

// Helper: Check if phone already exists
async function checkPhoneExists(phone: string): Promise<boolean> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('phone', '==', phone));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}
```

#### 3. Update form state type
```typescript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
});
```

#### 4. Connect form inputs
Each input should update formData:
```typescript
<Input
  value={formData.email}
  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
  // ... other props
/>
```

### Verification
- [ ] Form validation works for all fields
- [ ] Password strength requirements enforced
- [ ] Registration creates Firebase user
- [ ] Error messages display correctly
- [ ] Success redirects to login

---

## Step 4: Update biometricAuth.ts

### Location
`/Users/sonnguyen/dev/projects/money-tracker-mobile/services/biometricAuth.ts`

### Changes Required

#### 1. Add Firebase token validation
```typescript
import { getIdToken } from './authService';

/**
 * Check if Firebase session is valid for biometric auth
 */
export async function validateFirebaseSession(): Promise<boolean> {
  const token = await getIdToken();
  return token !== null;
}
```

#### 2. Update saveCredentials to store user ID
```typescript
interface StoredCredentials {
  // Existing fields...
  userId?: string;  // Firebase UID
}

export async function saveCredentials(
  password: string,
  userId?: string
): Promise<boolean> {
  // Existing implementation...
  // Add userId to stored data
  const credentials: StoredCredentials = {
    // existing fields...
    userId,
  };
  // ...
}
```

#### 3. Add session validation to authenticate flow
```typescript
export async function authenticateWithBiometric(): Promise<BiometricAuthResult> {
  // NEW: First check Firebase session
  const hasValidSession = await validateFirebaseSession();
  if (!hasValidSession) {
    return {
      success: false,
      error: 'Phiên đăng nhập đã hết hạn',
    };
  }

  // Existing biometric authentication...
}
```

### Verification
- [ ] Biometric auth fails gracefully if Firebase session expired
- [ ] Error message is user-friendly
- [ ] Successful biometric auth still works

---

## Phase 2 Verification Checklist

### Unit Tests (Manual)

#### Login Flow
1. [ ] Enter valid email + password → Login succeeds
2. [ ] Enter invalid email format → Shows validation error
3. [ ] Enter wrong password → Shows "Mật khẩu không đúng"
4. [ ] Enter non-existent email → Shows "Không tìm thấy tài khoản"
5. [ ] Tap "Quên mật khẩu?" → Navigates to `/forgot-password` screen
6. [ ] Enter email on forgot-password screen → sends reset, shows success state
7. [ ] Enter phone on forgot-password screen → looks up email, sends reset, shows success state

#### Registration Flow
1. [ ] Fill all fields correctly → Creates account, redirects to login
2. [ ] Missing name → Shows validation error
3. [ ] Invalid email → Shows "Email không hợp lệ"
4. [ ] Weak password → Shows specific requirement
5. [ ] Password mismatch → Shows "không khớp"
6. [ ] Email already used → Shows "đã được sử dụng"

#### Biometric Flow
1. [ ] Enable Face ID after email login → Prompts correctly
2. [ ] Use Face ID on subsequent login → Works with Firebase session
3. [ ] Let Firebase session expire → Biometric shows session error
4. [ ] Lockout after failed attempts → Still works

#### Session Management
1. [ ] Login persists after app restart
2. [ ] Logout clears Firebase session
3. [ ] Auth state listener updates UI correctly

### Integration Checks

```bash
# TypeScript check
npx tsc --noEmit

# Run on simulator
npx expo start --ios
npx expo start --android
```

- [ ] No TypeScript errors
- [ ] App runs on iOS simulator
- [ ] App runs on Android emulator
- [ ] Firebase console shows registered users

---

## Troubleshooting

### Issue: "auth/network-request-failed"
**Solution:** Check internet connection and Firebase project status.

### Issue: Login succeeds but user state is null
**Solution:** Verify onAuthStateChanged listener is set up correctly in AuthContext.

### Issue: Biometric login fails after password login
**Solution:** Ensure `saveCredentials` is called with the password after successful Firebase login.

### Issue: "auth/operation-not-allowed"
**Solution:** Enable Email/Password provider in Firebase Console > Authentication > Sign-in method.

---

## Questions Before Proceeding to Phase 3

1. Is email/password login working correctly?
2. Is user registration creating accounts in Firebase?
3. Does biometric login integrate with Firebase session?
4. Any issues with the logout flow?
5. Ready to implement 2FA/MFA?

---

## Next Phase

Once all verification checks pass, proceed to:
**[Phase 3: Integration](./phase-3-integration.md)** - Profile Management & Final Polish
