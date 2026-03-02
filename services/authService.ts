import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  updateProfile,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';

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

/**
 * Send email verification to current user
 */
export async function sendEmailVerification(): Promise<AuthResult> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'Chưa đăng nhập' };
  }

  try {
    await firebaseSendEmailVerification(user);
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
// Firestore User Data
// ============================================

/**
 * Create user document in Firestore
 */
export async function createUserDocument(
  uid: string,
  data: {
    email: string;
    phone: string;
    displayName: string;
  }
): Promise<AuthResult> {
  try {
    await setDoc(doc(db, 'users', uid), {
      email: data.email,
      phone: data.phone,
      displayName: data.displayName,
      createdAt: serverTimestamp(),
      emailVerified: false,
    });
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: 'Không thể lưu thông tin người dùng',
      errorCode: error.code,
    };
  }
}

/**
 * Get user document from Firestore
 */
export async function getUserDocument(uid: string): Promise<any | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user document:', error);
    return null;
  }
}

/**
 * Lookup email by phone number
 */
export async function lookupEmailByPhone(phone: string): Promise<string | null> {
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

/**
 * Check if phone number already exists
 */
export async function checkPhoneExists(phone: string): Promise<boolean> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', phone));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Phone check error:', error);
    return false;
  }
}

// Export auth instance for direct access if needed
export { auth };
