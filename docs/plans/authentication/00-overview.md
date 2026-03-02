# Firebase Authentication + 2FA/MFA Implementation

## Overview

This implementation adds production-ready authentication to SS Money Tracker with:
- **Firebase Auth** for email/phone + password authentication
- **Biometric auth** (Face ID/Touch ID) integrated with Firebase session
- **TOTP-based 2FA/MFA** (Google Authenticator compatible)

---

## Phase Structure

| Phase | Description | Files |
|-------|-------------|-------|
| [Phase 1](./phase-1-foundation.md) | Foundation - Firebase setup & dependencies | 4 files |
| [Phase 2](./phase-2-core-auth.md) | Core Auth - Firebase login/register integration | 4 files |
| [Phase 3](./phase-3-2fa-implementation.md) | 2FA - TOTP enrollment & verification | 4 files |
| [Phase 4](./phase-4-integration.md) | Integration - Profile management & polish | 4 files |

---

## Dependencies to Install

```bash
npm install firebase otplib expo-crypto react-native-qrcode-svg
```

| Package | Version | Purpose |
|---------|---------|---------|
| `firebase` | ^10.x | Firebase JS SDK (Expo managed workflow) |
| `otplib` | ^12.x | TOTP generation/verification |
| `expo-crypto` | ~14.x | Secure random, hashing |
| `react-native-qrcode-svg` | ^6.x | QR code for 2FA setup |

---

## Firebase Project Setup (Pre-requisite)

Before starting Phase 1, complete these steps:

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name: `money-tracker-mobile` (or your preference)
4. Disable Google Analytics (optional for MVP)
5. Click "Create project"

### 2. Enable Authentication
1. Go to Build > Authentication
2. Click "Get started"
3. Enable providers:
   - **Email/Password**: Enable both email/password and email link
   - **Phone**: Enable (requires billing for SMS)

### 3. Create Firestore Database
1. Go to Build > Firestore Database
2. Click "Create database"
3. Select production mode
4. Choose region closest to your users

### 4. Get Web App Configuration
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click Web icon (`</>`)
4. Register app name: `money-tracker-web`
5. Copy the `firebaseConfig` object values

### 5. Note Configuration Values
Save these for `app.json`:
```
apiKey: "AIza..."
authDomain: "your-project.firebaseapp.com"
projectId: "your-project-id"
storageBucket: "your-project.appspot.com"
messagingSenderId: "123456789"
appId: "1:123456789:web:abc123"
```

---

## File Structure After Implementation

```
/services/
├── firebase.ts          # NEW: Firebase initialization
├── authService.ts       # NEW: Firebase Auth wrapper
├── totpService.ts       # NEW: TOTP generation/verification
├── mfaService.ts        # NEW: MFA enrollment/verification
├── biometricAuth.ts     # MODIFY: Firebase session integration
└── securityCheck.ts     # EXISTING (no changes)

/context/
└── AuthContext.tsx      # MODIFY: Major refactor

/app/
├── login.tsx            # MODIFY: Email input, Firebase auth
├── register.tsx         # MODIFY: Complete registration
├── profile.tsx          # MODIFY: 2FA management section
├── mfa-setup.tsx        # NEW: 2FA enrollment screen
├── mfa-verify.tsx       # NEW: 2FA verification screen
└── _layout.tsx          # MODIFY: Add new screens

/components/
└── OTPInput.tsx         # NEW: 6-digit code input
```

---

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │   Login      │────▶│   Firebase   │────▶│  Check MFA   │     │
│  │   Screen     │     │   Auth       │     │   Status     │     │
│  └──────────────┘     └──────────────┘     └──────┬───────┘     │
│                                                    │             │
│                               ┌────────────────────┴────────┐   │
│                               ▼                             ▼   │
│                        ┌──────────────┐           ┌──────────┐  │
│                        │  MFA Verify  │           │   Home   │  │
│                        │   Screen     │──────────▶│  Screen  │  │
│                        └──────────────┘           └──────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    BIOMETRIC + 2FA FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │  Biometric   │────▶│   Check      │────▶│  Trusted     │     │
│  │   Prompt     │     │   Token      │     │  Device?     │     │
│  └──────────────┘     └──────────────┘     └──────┬───────┘     │
│                                                    │             │
│                               ┌────────────────────┴────────┐   │
│                               ▼                             ▼   │
│                        ┌──────────────┐           ┌──────────┐  │
│                        │  MFA Verify  │           │   Home   │  │
│                        │  (required)  │──────────▶│  Screen  │  │
│                        └──────────────┘           └──────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Verification Process

After each phase:
1. Run the verification checklist
2. Test manually on device/simulator
3. Document any issues found
4. Fix issues before proceeding
5. Confirm with user before next phase

---

## Confirmed Requirements

Based on discussion with the user:

### 1. Firebase Project
- **Status**: Needs to be created before Phase 1
- Create free Firebase project (Spark plan)
- Enable Email/Password authentication provider

### 2. Registration Flow
- **Collect both**: Email + Phone number
- **Verification**: Via email only (free, no SMS cost)
- Firebase sends verification email, no phone SMS required

### 3. Login Flow
- **Single input field** accepting either email OR phone
- Detect input type automatically:
  - Contains `@` → Email login
  - Numbers only → Phone lookup
- **First login type** is remembered for that user
- Subsequent logins prioritize the original method

### 4. Password Requirements (Standard)
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

### 5. 2FA Enforcement
- **Optional** (user choice)
- Available in Profile > Security settings
- Not prompted automatically after registration

### 6. Session Duration
- Biometric token: 30 days
- Password session: Firebase default (1 hour, auto-refresh)
- Trusted device: 30 days
