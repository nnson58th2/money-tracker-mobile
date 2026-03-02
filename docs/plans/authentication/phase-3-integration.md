# Phase 4: Integration - Profile Management & Final Polish

## Objective
Complete the authentication implementation with profile management, trusted device handling, and final polish.

## Prerequisites
- [ ] Phase 3 completed and verified
- [ ] MFA enrollment and verification working
- [ ] Backup codes functionality working

---

## Files to Modify

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `app/profile.tsx` | Modify | Add 2FA management section |
| 2 | `services/biometricAuth.ts` | Modify | Add trusted device for 2FA bypass |
| 3 | `context/AuthContext.tsx` | Modify | Finalize all auth flows |
| 4 | `app/_layout.tsx` | Modify | Final navigation adjustments |

---

## Step 1: Update profile.tsx with 2FA Management

### Location
`/Users/sonnguyen/dev/projects/money-tracker-mobile/app/profile.tsx`

### Add 2FA Section

Insert after the existing biometric section:

```typescript
import { useAuth } from '@/context/AuthContext';
import { checkMfaStatus, disableMfa, regenerateBackupCodes } from '@/services/mfaService';

// Add state
const [mfaStatus, setMfaStatus] = useState<{ enabled: boolean; backupCodesRemaining?: number }>({ enabled: false });
const [showDisableMfa, setShowDisableMfa] = useState(false);
const [disablePassword, setDisablePassword] = useState('');
const [disableCode, setDisableCode] = useState('');

// Load MFA status on mount
useEffect(() => {
  loadMfaStatus();
}, []);

const loadMfaStatus = async () => {
  const status = await checkMfaStatus();
  setMfaStatus({
    enabled: status.enabled,
    backupCodesRemaining: status.backupCodesRemaining,
  });
};

// Handle disable MFA
const handleDisableMfa = async () => {
  if (!disablePassword || !disableCode) {
    Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu và mã xác thực');
    return;
  }

  setIsLoading(true);
  const result = await disableMfa(disablePassword, disableCode);

  if (result.success) {
    Alert.alert('Thành công', 'Đã tắt xác thực 2 yếu tố');
    setShowDisableMfa(false);
    setDisablePassword('');
    setDisableCode('');
    await loadMfaStatus();
  } else {
    Alert.alert('Lỗi', result.error || 'Không thể tắt 2FA');
  }
  setIsLoading(false);
};

// Handle regenerate backup codes
const handleRegenerateBackupCodes = async () => {
  Alert.prompt(
    'Nhập mật khẩu',
    'Xác nhận để tạo mã khôi phục mới',
    async (password) => {
      if (!password) return;

      setIsLoading(true);
      const result = await regenerateBackupCodes(password);

      if (result.success && result.backupCodes) {
        Alert.alert(
          'Mã khôi phục mới',
          result.backupCodes.join('\n'),
          [
            {
              text: 'Sao chép',
              onPress: () => {
                Clipboard.setString(result.backupCodes!.join('\n'));
                Alert.alert('Đã sao chép');
              },
            },
            { text: 'Đóng' },
          ]
        );
        await loadMfaStatus();
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể tạo mã mới');
      }
      setIsLoading(false);
    },
    'secure-text'
  );
};

// JSX for 2FA section
{/* 2FA Section */}
<YStack paddingHorizontal={24} marginBottom={24}>
  <Text color="$tertiary" fontSize={14} fontWeight="600" marginBottom={12}>
    XÁC THỰC HAI YẾU TỐ
  </Text>

  <BlurCard>
    <YStack padding={20} gap={16}>
      {/* Status Row */}
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap={16}>
          <Circle size={40} backgroundColor={mfaStatus.enabled ? '$green5' : '$tertiary'}>
            <Ionicons
              name="shield-checkmark"
              size={22}
              color={mfaStatus.enabled ? 'green' : theme.colorBox?.val}
            />
          </Circle>
          <YStack>
            <Text fontSize={16} fontWeight="600" color="$color">
              Google Authenticator
            </Text>
            <Text color="$tertiary" fontSize={14}>
              {mfaStatus.enabled ? 'Đã bật' : 'Chưa bật'}
            </Text>
          </YStack>
        </XStack>

        {!mfaStatus.enabled ? (
          <Button
            size="$3"
            backgroundColor="$primary"
            onPress={() => router.push('/mfa-setup')}
          >
            Bật
          </Button>
        ) : (
          <Button
            size="$3"
            backgroundColor="$red10"
            onPress={() => setShowDisableMfa(true)}
          >
            Tắt
          </Button>
        )}
      </XStack>

      {/* Backup codes info (when enabled) */}
      {mfaStatus.enabled && (
        <>
          <YStack
            backgroundColor="$background"
            padding={12}
            borderRadius={8}
            gap={8}
          >
            <XStack justifyContent="space-between" alignItems="center">
              <Text color="$tertiary" fontSize={14}>
                Mã khôi phục còn lại
              </Text>
              <Text
                color={mfaStatus.backupCodesRemaining! < 3 ? '$red10' : '$color'}
                fontWeight="600"
              >
                {mfaStatus.backupCodesRemaining}/10
              </Text>
            </XStack>

            {mfaStatus.backupCodesRemaining! < 3 && (
              <Text color="$red10" fontSize={12}>
                ⚠️ Số mã còn lại ít, nên tạo mã mới
              </Text>
            )}
          </YStack>

          <Button
            variant="outlined"
            onPress={handleRegenerateBackupCodes}
            icon={<Ionicons name="refresh" size={20} color={theme.color?.val} />}
          >
            Tạo mã khôi phục mới
          </Button>
        </>
      )}
    </YStack>
  </BlurCard>
</YStack>

{/* Disable MFA Modal */}
<Sheet
  open={showDisableMfa}
  onOpenChange={setShowDisableMfa}
  snapPoints={[50]}
>
  <Sheet.Frame padding={24}>
    <YStack gap={20}>
      <Text fontSize={20} fontWeight="700" color="$color">
        Tắt xác thực 2 yếu tố
      </Text>
      <Text color="$tertiary">
        Nhập mật khẩu và mã từ ứng dụng xác thực để tắt 2FA
      </Text>

      <Input
        placeholder="Mật khẩu"
        value={disablePassword}
        onChangeText={setDisablePassword}
        secureTextEntry
        backgroundColor="$colorBox"
        borderWidth={0}
        padding={16}
      />

      <Input
        placeholder="Mã xác thực (6 số)"
        value={disableCode}
        onChangeText={setDisableCode}
        keyboardType="number-pad"
        maxLength={6}
        backgroundColor="$colorBox"
        borderWidth={0}
        padding={16}
      />

      <XStack gap={12}>
        <Button
          flex={1}
          variant="outlined"
          onPress={() => setShowDisableMfa(false)}
        >
          Huỷ
        </Button>
        <Button
          flex={1}
          backgroundColor="$red10"
          onPress={handleDisableMfa}
          disabled={isLoading}
        >
          {isLoading ? <Spinner color="white" /> : 'Tắt 2FA'}
        </Button>
      </XStack>
    </YStack>
  </Sheet.Frame>
</Sheet>
```

### Verification
- [ ] 2FA section displays current status
- [ ] Enable button navigates to mfa-setup
- [ ] Disable button shows confirmation modal
- [ ] Backup codes count displays correctly
- [ ] Regenerate codes works

---

## Step 2: Add Trusted Device for 2FA Bypass

### Location
`/Users/sonnguyen/dev/projects/money-tracker-mobile/services/biometricAuth.ts`

### Add Trusted Device Logic

```typescript
// Storage keys
const TRUSTED_DEVICE_KEY = 'trusted_device_token';

// Types
interface TrustedDeviceToken {
  userId: string;
  deviceId: string;
  mfaVerifiedAt: number;
  expiresAt: number;  // 30 days
  tokenHash: string;
}

/**
 * Create a trusted device token after MFA verification
 * This allows biometric login to bypass 2FA
 */
export async function createTrustedDeviceToken(userId: string): Promise<void> {
  const deviceId = await getOrCreateDeviceId();
  const now = Date.now();
  const expiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 days

  // Create a unique token hash
  const tokenData = `${userId}:${deviceId}:${now}`;
  const tokenHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    tokenData
  );

  const token: TrustedDeviceToken = {
    userId,
    deviceId,
    mfaVerifiedAt: now,
    expiresAt,
    tokenHash,
  };

  await SecureStore.setItemAsync(TRUSTED_DEVICE_KEY, JSON.stringify(token));
}

/**
 * Check if current device is trusted for 2FA bypass
 */
export async function isTrustedDevice(userId: string): Promise<boolean> {
  try {
    const stored = await SecureStore.getItemAsync(TRUSTED_DEVICE_KEY);
    if (!stored) return false;

    const token: TrustedDeviceToken = JSON.parse(stored);
    const currentDeviceId = await getOrCreateDeviceId();

    // Validate token
    if (
      token.userId !== userId ||
      token.deviceId !== currentDeviceId ||
      token.expiresAt < Date.now()
    ) {
      // Token invalid or expired, clear it
      await clearTrustedDeviceToken();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking trusted device:', error);
    return false;
  }
}

/**
 * Clear trusted device token (on logout or security events)
 */
export async function clearTrustedDeviceToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TRUSTED_DEVICE_KEY);
}

/**
 * Extend trusted device expiration (called on successful biometric auth)
 */
export async function extendTrustedDeviceExpiration(): Promise<void> {
  try {
    const stored = await SecureStore.getItemAsync(TRUSTED_DEVICE_KEY);
    if (!stored) return;

    const token: TrustedDeviceToken = JSON.parse(stored);
    token.expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);

    await SecureStore.setItemAsync(TRUSTED_DEVICE_KEY, JSON.stringify(token));
  } catch (error) {
    console.error('Error extending trusted device:', error);
  }
}
```

### Update loginWithFaceId in AuthContext

```typescript
const loginWithFaceId = useCallback(async (): Promise<{
  success: boolean;
  error?: string;
  requiresMfa?: boolean;
}> => {
  // ... existing lockout and integrity checks ...

  // Perform biometric authentication
  const result = await BiometricAuth.authenticateWithBiometric();

  if (!result.success) {
    // ... existing error handling ...
    return { success: false, error: result.error };
  }

  // Get current user from stored credentials
  const credentials = await BiometricAuth.getStoredCredentials();
  if (!credentials || !credentials.userId) {
    return { success: false, error: 'Thông tin đăng nhập không hợp lệ' };
  }

  // Check if device is trusted (skip MFA)
  const isTrusted = await BiometricAuth.isTrustedDevice(credentials.userId);

  if (state.isMfaEnabled && !isTrusted) {
    // MFA enabled but device not trusted - require MFA verification
    dispatch({ type: 'SET_MFA_STATUS', payload: { enabled: true, verified: false, pending: true } });
    return { success: true, requiresMfa: true };
  }

  // Either MFA not enabled, or device is trusted
  await BiometricAuth.extendTrustedDeviceExpiration();
  dispatch({ type: 'LOGIN' });

  return { success: true };
}, [state.isMfaEnabled]);
```

### Verification
- [ ] First login with MFA creates trusted device
- [ ] Subsequent biometric login skips MFA
- [ ] Trusted status expires after 30 days
- [ ] Logout clears trusted device status

---

## Step 3: Finalize AuthContext

### Complete AuthContext Updates

```typescript
// Add to context value
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
  register,
  resetPassword,
  reauthenticate,
  clearError,

  // MFA related
  completeMfaVerification,
  checkMfaEnabled: async () => {
    const status = await checkMfaStatus();
    dispatch({ type: 'SET_MFA_STATUS', payload: {
      enabled: status.enabled,
      verified: state.isMfaVerified,
      pending: state.mfaPending,
    }});
    return status.enabled;
  },
};

// Update completeMfaVerification to create trusted device
const completeMfaVerification = useCallback(async () => {
  if (state.user) {
    // Create trusted device token
    await BiometricAuth.createTrustedDeviceToken(state.user.uid);
  }

  dispatch({ type: 'SET_MFA_STATUS', payload: {
    enabled: true,
    verified: true,
    pending: false,
  }});
  dispatch({ type: 'LOGIN' });
}, [state.user]);

// Update logout to clear trusted device
const logout = useCallback(async () => {
  dispatch({ type: 'SET_LOADING', payload: true });

  try {
    await firebaseSignOut();
    await BiometricAuth.clearTrustedDeviceToken(); // Clear trusted device
  } catch (error) {
    console.error('Logout error:', error);
  }

  dispatch({ type: 'LOGOUT' });
  dispatch({ type: 'SET_USER', payload: null });
  dispatch({ type: 'SET_AUTH_METHOD', payload: null });
  dispatch({ type: 'SET_MFA_STATUS', payload: { enabled: false, verified: false, pending: false } });
  dispatch({ type: 'SET_LOADING', payload: false });
}, []);
```

### Verification
- [ ] Login flow handles all auth methods
- [ ] MFA verification creates trusted device
- [ ] Logout clears all auth state
- [ ] Biometric + trusted device bypasses MFA

---

## Step 4: Final Navigation Adjustments

### Update app/_layout.tsx

```typescript
// Ensure all screens are registered
<Stack>
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  <Stack.Screen name="login" options={{ headerShown: false }} />
  <Stack.Screen name="register" options={{ headerShown: false }} />
  <Stack.Screen name="profile" options={{ headerShown: false }} />
  <Stack.Screen name="mfa-setup" options={{ headerShown: false }} />
  <Stack.Screen
    name="mfa-verify"
    options={{
      headerShown: false,
      gestureEnabled: false,  // Prevent swipe back
    }}
  />
  {/* Other screens */}
</Stack>
```

### Update Navigation Logic in AuthContext

```typescript
// Navigation effect
useEffect(() => {
  if (state.isLoading) return;

  const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';
  const inMfaVerify = segments[0] === 'mfa-verify';

  if (!state.isAuthenticated) {
    // Not authenticated - go to login (unless already there or registering)
    if (!inAuthGroup && !inMfaVerify) {
      router.replace('/login');
    }
  } else if (state.mfaPending) {
    // Authenticated but MFA pending - go to MFA verify
    if (!inMfaVerify) {
      router.replace('/mfa-verify');
    }
  } else {
    // Fully authenticated - go to home (unless already in protected area)
    if (inAuthGroup || inMfaVerify) {
      router.replace('/(tabs)');
    }
  }
}, [state.isAuthenticated, state.mfaPending, state.isLoading, segments]);
```

### Verification
- [ ] Unauthenticated user → Login screen
- [ ] Authenticated but MFA pending → MFA verify screen
- [ ] Fully authenticated → Home screen
- [ ] Cannot navigate back from MFA verify

---

## Phase 4 Verification Checklist

### Profile 2FA Management
1. [ ] 2FA section shows correct status
2. [ ] Can navigate to enable 2FA
3. [ ] Can disable 2FA with password + code
4. [ ] Backup codes count updates correctly
5. [ ] Can regenerate backup codes

### Trusted Device Flow
1. [ ] Login with password + MFA → Device trusted
2. [ ] Biometric login skips MFA on trusted device
3. [ ] Logout clears trusted device status
4. [ ] 30-day expiration works
5. [ ] New device requires MFA

### Complete Auth Flows

#### Flow 1: New User Registration
1. [ ] Register with email + password
2. [ ] Login with password
3. [ ] Enable Face ID
4. [ ] Enable 2FA
5. [ ] Logout
6. [ ] Login with Face ID (skips MFA - trusted device)

#### Flow 2: Password Login with MFA
1. [ ] Enter email + password
2. [ ] Redirected to MFA verify
3. [ ] Enter TOTP code
4. [ ] Login complete, device trusted

#### Flow 3: Biometric Login (Untrusted Device)
1. [ ] Clear trusted device token
2. [ ] Use Face ID
3. [ ] Redirected to MFA verify
4. [ ] Enter TOTP code
5. [ ] Login complete, device now trusted

#### Flow 4: Backup Code Recovery
1. [ ] Login with password
2. [ ] MFA screen → Use backup code
3. [ ] Enter valid backup code
4. [ ] Login succeeds
5. [ ] Code marked as used

### Edge Cases
1. [ ] Network offline during login → Appropriate error
2. [ ] Firebase session expires → Redirect to login
3. [ ] Biometric integrity change → Requires password
4. [ ] All backup codes used → Warning displayed

---

## Final Security Checklist

### Data Storage
- [ ] Passwords never stored in plaintext
- [ ] TOTP secrets stored in SecureStore only
- [ ] Firebase tokens refreshed appropriately
- [ ] Trusted device tokens expire correctly

### Authentication
- [ ] Failed attempts tracked and locked out
- [ ] Biometric integrity verified
- [ ] MFA required when device not trusted
- [ ] Session invalidated on security events

### User Experience
- [ ] Error messages in Vietnamese
- [ ] Loading states displayed
- [ ] Appropriate alerts and confirmations
- [ ] Smooth navigation between screens

---

## Deployment Checklist

Before deploying to production:

1. **Firebase Configuration**
   - [ ] Production Firebase project created
   - [ ] API keys restricted to app bundle IDs
   - [ ] Firestore security rules configured
   - [ ] Phone auth quotas set appropriately

2. **App Store Requirements**
   - [ ] Face ID usage description in Info.plist
   - [ ] Biometric permission descriptions
   - [ ] Privacy policy updated for data collection

3. **Testing**
   - [ ] Test on physical iOS device (Face ID)
   - [ ] Test on physical Android device (Fingerprint)
   - [ ] Test MFA with Google Authenticator
   - [ ] Test backup code recovery
   - [ ] Test offline scenarios

4. **Monitoring**
   - [ ] Firebase Analytics enabled
   - [ ] Error tracking (Sentry/Crashlytics)
   - [ ] Auth event logging

---

## Questions for Final Review

1. Is the complete authentication flow working as expected?
2. Any UI/UX improvements needed?
3. Are error messages clear and helpful?
4. Any additional security features required?
5. Ready for production deployment?

---

## Summary

After completing all 4 phases, the authentication system includes:

| Feature | Status |
|---------|--------|
| Email/Password Login | ✅ |
| User Registration | ✅ |
| Password Reset | ✅ |
| Biometric (Face ID/Touch ID) | ✅ |
| TOTP-based 2FA | ✅ |
| Backup Codes | ✅ |
| Trusted Device | ✅ |
| Session Management | ✅ |
| Lockout Protection | ✅ |
| Biometric Integrity Check | ✅ |

The implementation follows security best practices and provides a production-ready authentication experience for the SS Money Tracker app.
