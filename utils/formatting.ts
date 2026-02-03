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
