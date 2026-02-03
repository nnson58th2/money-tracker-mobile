# QR Receive Money Implementation Plan

## Overview
Implement a QR code feature for receiving bank transfers using the SePay QR API. Users can generate a QR code with their bank account, optional amount, and transfer description.

## API Structure
```
https://qr.sepay.vn/img?acc=SO_TAI_KHOAN&bank=NGAN_HANG&amount=SO_TIEN&des=NOI_DUNG&template=compact
```

**Parameters:**
- `acc` (required): Bank account number
- `bank` (required): Bank code or short name
- `amount` (optional): Transfer amount
- `des` (optional): Transfer description
- `template`: Use `compact` for cleaner QR

---

## Implementation Steps

### Step 1: Create Bank Data Constants

**New file:** `constants/banks.ts`

```typescript
export const BANKS = [
  { code: 'TCB', name: 'Techcombank', shortName: 'Techcombank' },
  { code: 'VCB', name: 'Vietcombank', shortName: 'Vietcombank' },
  { code: 'BIDV', name: 'BIDV', shortName: 'BIDV' },
  { code: 'VTB', name: 'VietinBank', shortName: 'Vietinbank' },
  { code: 'MB', name: 'MB Bank', shortName: 'MBBank' },
  { code: 'ACB', name: 'ACB', shortName: 'ACB' },
  { code: 'TPB', name: 'TPBank', shortName: 'TPBank' },
  { code: 'VPB', name: 'VPBank', shortName: 'VPBank' },
  // Add more banks as needed
];

export const DEFAULT_BANK = 'TCB'; // Techcombank
```

### Step 2: Create QR Modal Screen

**New file:** `app/qr-receive.tsx`

**Features:**
- Bank selector dropdown (default: Techcombank)
- Account number input (required)
- Amount input (optional, formatted with thousand separators)
- Transfer description input (optional)
- Generate QR button
- Display QR image from SePay API
- Share/Save QR option

**UI Layout:**
```
┌─────────────────────────────┐
│         QR Nhận tiền        │
├─────────────────────────────┤
│  [Bank Selector ▼]          │
│  Techcombank                │
├─────────────────────────────┤
│  Số tài khoản *             │
│  [___________________]      │
├─────────────────────────────┤
│  Số tiền (tùy chọn)         │
│  [___________________] ₫    │
├─────────────────────────────┤
│  Nội dung (tùy chọn)        │
│  [___________________]      │
├─────────────────────────────┤
│                             │
│      ┌─────────────┐        │
│      │   QR CODE   │        │
│      │   IMAGE     │        │
│      └─────────────┘        │
│                             │
│  [    Chia sẻ QR    ]       │
└─────────────────────────────┘
```

### Step 3: Create QR URL Generator Utility

**New file:** `utils/qrGenerator.ts`

```typescript
interface QRParams {
  accountNumber: string;
  bankCode: string;
  amount?: number;
  description?: string;
}

export function generateQRUrl(params: QRParams): string {
  const baseUrl = 'https://qr.sepay.vn/img';
  const queryParams = new URLSearchParams({
    acc: params.accountNumber,
    bank: params.bankCode,
    template: 'compact',
  });

  if (params.amount) {
    queryParams.append('amount', params.amount.toString());
  }
  if (params.description) {
    queryParams.append('des', params.description);
  }

  return `${baseUrl}?${queryParams.toString()}`;
}
```

### Step 4: Update Home Screen

**File:** `app/(tabs)/index.tsx`

**Changes:**
- Add `onPress` handler to QR button (line 165-169)
- Navigate to `/qr-receive` modal

```typescript
onPress={() => router.push('/qr-receive')}
```

### Step 5: Update Login Screen

**File:** `app/login.tsx`

**Changes:**
- Add `onPress` handler to "QR nhận tiền" QuickAction
- Navigate to `/qr-receive` modal (accessible without login for quick access)

### Step 6: Register New Route

**File:** `app/_layout.tsx`

**Changes:**
- Add new Stack.Screen for `qr-receive` modal

```typescript
<Stack.Screen
  name="qr-receive"
  options={{
    presentation: 'modal',
    title: 'QR Nhận tiền',
    headerShown: true,
  }}
/>
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `constants/banks.ts` | **CREATE** | Bank list with codes |
| `utils/qrGenerator.ts` | **CREATE** | QR URL generator function |
| `app/qr-receive.tsx` | **CREATE** | QR receive money modal screen |
| `app/_layout.tsx` | **MODIFY** | Add qr-receive route |
| `app/(tabs)/index.tsx` | **MODIFY** | Add QR button navigation |
| `app/login.tsx` | **MODIFY** | Add QR quick action navigation |

---

## Component Details for `app/qr-receive.tsx`

### State
```typescript
const [selectedBank, setSelectedBank] = useState(DEFAULT_BANK);
const [accountNumber, setAccountNumber] = useState('');
const [amount, setAmount] = useState('');
const [description, setDescription] = useState('');
const [showBankPicker, setShowBankPicker] = useState(false);
const [qrUrl, setQrUrl] = useState<string | null>(null);
```

### Validation
- Account number is required
- Amount should be numeric only
- Generate QR only when account number is provided

### QR Display
- Use `<Image>` component to display QR from URL
- Show loading state while image loads
- Handle error if image fails to load

---

## User Flow

### From Home Screen:
1. User taps QR button on balance card
2. Modal opens with QR form
3. User enters/confirms account number
4. Optionally enters amount and description
5. QR is generated and displayed
6. User can share or save QR

### From Login Screen:
1. User taps "QR nhận tiền" quick action
2. Same modal opens
3. User can generate QR without logging in

---

## Verification Steps

1. **Test QR Generation:**
   - Enter account number only → QR should generate
   - Add amount → QR URL should include amount
   - Add description → QR URL should include description

2. **Test Bank Selection:**
   - Default should be Techcombank
   - Changing bank should update QR

3. **Test Navigation:**
   - QR button on home screen opens modal
   - QR quick action on login screen opens modal
   - Modal can be dismissed

4. **Test QR Image:**
   - QR image loads correctly
   - Image is scannable by banking apps
