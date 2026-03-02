/**
 * Shared formatting utilities for the Money Tracker app
 */

export type BiometricType = 'face' | 'fingerprint' | 'iris' | null;

/**
 * Format amount with thousand separators (comma style: 1,000,000)
 * @param value - Raw string input (may contain non-numeric characters)
 * @returns Formatted string with comma separators
 */
export function formatAmount(value: string): string {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (!cleanValue) return '';
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Parse formatted amount back to number
 * @param formattedValue - Formatted string (e.g., "1,000,000")
 * @returns Number value
 */
export function parseAmount(formattedValue: string): number {
    const numericValue = formattedValue.replace(/[^0-9]/g, '');
    return numericValue ? parseInt(numericValue, 10) : 0;
}

/**
 * Format amount for display with currency symbol
 * @param value - Number or string value
 * @returns Formatted string with comma separators and currency symbol
 */
export function formatCurrency(value: number | string): string {
    const numValue = typeof value === 'string' ? parseAmount(value) : value;
    if (!numValue) return '0 ₫';
    return `${numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ₫`;
}

/**
 * Check if two dates are the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    );
}

/**
 * Check if a date is today
 * @param date - Date to check
 * @returns True if the date is today
 */
export function isToday(date: Date): boolean {
    return isSameDay(date, new Date());
}

/**
 * Format date in Vietnamese style
 * @param date - Date to format
 * @returns Formatted date string (e.g., "Hôm nay, 15 tháng 1" or "15 tháng 1, 2024")
 */
export function formatVietnameseDate(date: Date): string {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    if (isToday(date)) {
        return `Hôm nay, ${day} tháng ${month}`;
    }
    return `${day} tháng ${month}, ${year}`;
}

/**
 * Get localized biometric label
 * @param type - Biometric type ('face', 'fingerprint', 'iris', or null)
 * @returns Vietnamese label for the biometric type
 */
export function getBiometricLabel(type: BiometricType): string {
    switch (type) {
        case 'face':
            return 'Face ID';
        case 'fingerprint':
            return 'Touch ID';
        case 'iris':
            return 'Iris ID';
        default:
            return 'Sinh trắc học';
    }
}

/**
 * Format notification badge count
 * @param count - Notification count
 * @returns Formatted badge text (e.g., "9+" for counts > 9)
 */
export function formatBadgeCount(count: number): string {
    if (count <= 0) return '';
    if (count > 99) return '99+';
    if (count > 9) return '9+';
    return count.toString();
}

// ============================================
// REMEMBERED USER FORMATTING FUNCTIONS
// ============================================

/**
 * Get display name with smart fallback chain
 * @param displayName - User's display name (may be null)
 * @param identifier - User's email or phone
 * @param identifierType - 'email' or 'phone'
 * @returns Display name using fallback: displayName → email prefix → 'Bạn'
 */
export function getDisplayNameWithFallback(
    displayName: string | null | undefined,
    identifier: string | null | undefined,
    identifierType: 'email' | 'phone' | null | undefined
): string {
    // Try displayName first
    if (displayName && displayName.trim()) {
        return displayName.trim();
    }

    // For email, extract prefix before @
    if (identifierType === 'email' && identifier) {
        const emailPrefix = identifier.split('@')[0];
        if (emailPrefix) {
            return emailPrefix;
        }
    }

    // Default fallback
    return 'Bạn';
}

/**
 * Mask email for display (e.g., "example@gmail.com" → "e***e@gmail.com")
 * @param email - Email address to mask
 * @returns Masked email string
 */
export function maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;

    const [localPart, domain] = email.split('@');

    if (localPart.length <= 2) {
        return `${localPart[0]}***@${domain}`;
    }

    const firstChar = localPart[0];
    const lastChar = localPart[localPart.length - 1];
    return `${firstChar}***${lastChar}@${domain}`;
}

/**
 * Mask phone number for display (e.g., "0987654321" → "09***321")
 * @param phone - Phone number to mask
 * @returns Masked phone string
 */
export function maskPhone(phone: string): string {
    if (!phone || phone.length < 6) return phone;

    // Keep first 2 digits and last 3 digits
    const firstPart = phone.slice(0, 2);
    const lastPart = phone.slice(-3);
    return `${firstPart}***${lastPart}`;
}

/**
 * Mask identifier based on type
 * @param identifier - Email or phone to mask
 * @param identifierType - 'email' or 'phone'
 * @returns Masked identifier string
 */
export function maskIdentifier(
    identifier: string,
    identifierType: 'email' | 'phone' | null | undefined
): string {
    if (!identifier) return '';

    if (identifierType === 'email') {
        return maskEmail(identifier);
    }

    if (identifierType === 'phone') {
        return maskPhone(identifier);
    }

    // Auto-detect type
    if (identifier.includes('@')) {
        return maskEmail(identifier);
    }

    return maskPhone(identifier);
}
