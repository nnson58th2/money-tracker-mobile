# Phase 1: Foundation - Firebase Setup & Dependencies

## Objective
Set up Firebase infrastructure and install required dependencies.

---

## Files to Create/Modify

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `package.json` | Modify | Add new dependencies |
| 2 | `app.json` | Modify | Add Firebase config |
| 3 | `services/firebase.ts` | Create | Firebase initialization |
| 4 | `services/authService.ts` | Create | Firebase Auth wrapper |

---

## Step 1: Install Dependencies

### Command
```bash
npm install firebase otplib expo-crypto react-native-qrcode-svg
```

### Expected Changes to package.json
```json
{
  "dependencies": {
    "firebase": "^10.x.x",
    "otplib": "^12.x.x",
    "expo-crypto": "~14.x.x",
    "react-native-qrcode-svg": "^6.x.x"
  }
}
```

### Verification
- [ ] No installation errors
- [ ] All packages in node_modules
- [ ] package-lock.json updated

---

## Step 2: Update app.json

### Location
`/Users/sonnguyen/dev/projects/money-tracker-mobile/app.json`

### Changes
Add `extra` configuration with Firebase values:

```json
{
  "expo": {
    "extra": {
      "firebase": {
        "apiKey": "YOUR_API_KEY",
        "authDomain": "YOUR_PROJECT.firebaseapp.com",
        "projectId": "YOUR_PROJECT_ID",
        "storageBucket": "YOUR_PROJECT.appspot.com",
        "messagingSenderId": "YOUR_SENDER_ID",
        "appId": "YOUR_APP_ID"
      }
    }
  }
}
```

### Security Note
For production, consider using environment variables with `expo-constants` or `react-native-dotenv`. The `extra` field is bundled into the app but not exposed publicly.

### Verification
- [ ] Config values match Firebase console
- [ ] No syntax errors in app.json
- [ ] App still starts with `npx expo start`

---

## Step 3: Create services/firebase.ts

### Location
`/Users/sonnguyen/dev/projects/money-tracker-mobile/services/firebase.ts`

### Implementation

```typescript
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get config from app.json extra
const firebaseConfig = Constants.expoConfig?.extra?.firebase;

if (!firebaseConfig) {
  throw new Error(
    'Firebase configuration not found. Please add firebase config to app.json extra field.'
  );
}

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);

  // Initialize Auth with AsyncStorage persistence for React Native
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });

  db = getFirestore(app);
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
export default app;
```

### Dependencies Check
This file requires `@react-native-async-storage/async-storage` which should already be installed (check package.json). If not:
```bash
npm install @react-native-async-storage/async-storage
```

### Verification
- [ ] File compiles without TypeScript errors
- [ ] Import in another file doesn't crash
- [ ] `auth` and `db` exports are defined

---

## Step 4: Create services/authService.ts

### Location
`/Users/sonnguyen/dev/projects/money-tracker-mobile/services/authService.ts`

### Implementation

```typescript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  User,
  UserCredential,
  PhoneAuthProvider,
  signInWithCredential,
  linkWithCredential,
  ConfirmationResult,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from 'firebase/auth';
import { auth } from './firebase';

// ============================================
// Types
// ============================================

export interface AuthUser {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  errorCode?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Map Firebase User to simplified AuthUser
 */
export function mapFirebaseUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    phoneNumber: user.phoneNumber,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
}

/**
 * Map Firebase error codes to user-friendly Vietnamese messages
 */
function getErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Email này đã được sử dụng',
    'auth/invalid-email': 'Email không hợp lệ',
    'auth/operation-not-allowed': 'Phương thức đăng nhập chưa được kích hoạt',
    'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự)',
    'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa',
    'auth/user-not-found': 'Không tìm thấy tài khoản với email này',
    'auth/wrong-password': 'Mật khẩu không đúng',
    'auth/invalid-credential': 'Thông tin đăng nhập không hợp lệ',
    'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng thử lại sau',
    'auth/network-request-failed': 'Lỗi kết nối mạng',
    'auth/requires-recent-login': 'Vui lòng đăng nhập lại để thực hiện thao tác này',
    'auth/invalid-phone-number': 'Số điện thoại không hợp lệ',
    'auth/missing-phone-number': 'Vui lòng nhập số điện thoại',
    'auth/quota-exceeded': 'Đã vượt quá giới hạn SMS. Vui lòng thử lại sau',
  };

  return errorMessages[errorCode] || 'Đã xảy ra lỗi. Vui lòng thử lại';
}

// ============================================
// Email/Password Authentication
// ============================================

/**
 * Register new user with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: mapFirebaseUser(credential.user),
    };
  } catch (error: any) {
    return {
      success: false,
      error: getErrorMessage(error.code),
      errorCode: error.code,
    };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: mapFirebaseUser(credential.user),
    };
  } catch (error: any) {
    return {
      success: false,
      error: getErrorMessage(error.code),
      errorCode: error.code,
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<AuthResult> {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: getErrorMessage(error.code),
      errorCode: error.code,
    };
  }
}

// ============================================
// Session Management
// ============================================

/**
 * Get current authenticated user
 */
export function getCurrentUser(): AuthUser | null {
  const user = auth.currentUser;
  return user ? mapFirebaseUser(user) : null;
}

/**
 * Get Firebase ID token for API authentication
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.error('Failed to get ID token:', error);
    return null;
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
): () => void {
  return onAuthStateChanged(auth, (user) => {
    callback(user ? mapFirebaseUser(user) : null);
  });
}

// ============================================
// User Profile
// ============================================

/**
 * Update user display name and/or photo URL
 */
export async function updateUserProfile(
  displayName?: string,
  photoURL?: string
): Promise<AuthResult> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'Chưa đăng nhập' };
  }

  try {
    await updateProfile(user, { displayName, photoURL });
    return { success: true, user: mapFirebaseUser(user) };
  } catch (error: any) {
    return {
      success: false,
      error: getErrorMessage(error.code),
      errorCode: error.code,
    };
  }
}

/**
 * Update user password (requires recent authentication)
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'Chưa đăng nhập' };
  }

  try {
    await firebaseUpdatePassword(user, newPassword);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: getErrorMessage(error.code),
      errorCode: error.code,
    };
  }
}

/**
 * Re-authenticate user with password (required for sensitive operations)
 */
export async function reauthenticateWithPassword(
  password: string
): Promise<AuthResult> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    return { success: false, error: 'Chưa đăng nhập' };
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: getErrorMessage(error.code),
      errorCode: error.code,
    };
  }
}

// ============================================
// Phone Authentication (Optional - Phase 2)
// ============================================

// Note: Phone auth requires additional setup with reCAPTCHA
// This will be implemented in Phase 2 if needed

export async function signInWithPhone(
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult | null> {
  try {
    return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  } catch (error) {
    console.error('Phone sign in error:', error);
    return null;
  }
}

export async function verifyPhoneCode(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<AuthResult> {
  try {
    const credential = await confirmationResult.confirm(code);
    return {
      success: true,
      user: mapFirebaseUser(credential.user),
    };
  } catch (error: any) {
    return {
      success: false,
      error: getErrorMessage(error.code),
      errorCode: error.code,
    };
  }
}
```

### Verification
- [ ] File compiles without TypeScript errors
- [ ] All exports are accessible
- [ ] Error messages are in Vietnamese

---

## Phase 1 Verification Checklist

### Installation Check
```bash
# Verify packages installed
npm ls firebase otplib expo-crypto react-native-qrcode-svg
```
- [ ] All 4 packages listed without errors

### Import Check
Create a temporary test in any existing file:
```typescript
import { auth, db } from '@/services/firebase';
import { signInWithEmail, signUpWithEmail } from '@/services/authService';

console.log('Firebase auth:', auth);
console.log('Firebase db:', db);
```
- [ ] No import errors
- [ ] Console logs show Firebase instances

### App Start Check
```bash
npx expo start
```
- [ ] App starts without crashes
- [ ] No Firebase initialization errors in console

### TypeScript Check
```bash
npx tsc --noEmit
```
- [ ] No type errors related to new files

---

## Troubleshooting

### Issue: "Firebase configuration not found"
**Solution:** Ensure `app.json` has the `extra.firebase` object with valid values.

### Issue: "AsyncStorage is not defined"
**Solution:** Install @react-native-async-storage/async-storage:
```bash
npm install @react-native-async-storage/async-storage
```

### Issue: TypeScript errors with Firebase imports
**Solution:** Ensure `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

### Issue: "getReactNativePersistence is not a function"
**Solution:** This function was added in Firebase v10. Ensure you have `firebase@^10.0.0`.

---

## Questions Before Proceeding to Phase 2

1. Did all packages install successfully?
2. Does the app start without Firebase-related errors?
3. Have you configured your Firebase project with the correct bundle IDs?
   - iOS: `com.sonnguyen.moneytracker`
   - Android: `com.anonymous.moneytracker`
4. Do you want to implement phone authentication in Phase 2, or just email?

---

## Next Phase

Once all verification checks pass, proceed to:
**[Phase 2: Core Auth](./phase-2-core-auth.md)** - Firebase login/register integration
