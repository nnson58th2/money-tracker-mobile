import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Storage key for security acknowledgment
const SECURITY_WARNING_ACK_KEY = 'securityWarningAck';

export type SecurityWarningLevel = 'critical' | 'warning' | 'info';

export interface SecurityIssue {
    id: string;
    level: SecurityWarningLevel;
    title: string;
    description: string;
    icon: string;
}

export interface SecurityCheckResult {
    isSecure: boolean;
    issues: SecurityIssue[];
    score: number; // 0-100, higher is more secure
}

/**
 * Check if the app is running in development/debug mode
 */
function isDebugMode(): boolean {
    return __DEV__;
}

/**
 * Check if running on an emulator/simulator
 * This uses heuristics since there's no perfect detection method
 */
function checkEmulatorIndicators(): {
    isLikelyEmulator: boolean;
    indicators: string[];
} {
    const indicators: string[] = [];

    // Check platform-specific indicators
    if (Platform.OS === 'ios') {
        // iOS Simulator detection
        // @ts-ignore - Platform.isPad may not be typed
        if (Platform.isPad === false && Platform.isTV === false) {
            // Additional checks could be done with native modules
        }
    } else if (Platform.OS === 'android') {
        // Android emulator often has these characteristics
        // Note: More accurate detection requires native modules
    }

    // In React Native, we can't reliably detect emulator without native modules
    // But we can check __DEV__ which is usually true in development
    if (__DEV__) {
        indicators.push('Development mode enabled');
    }

    return {
        isLikelyEmulator: indicators.length > 0,
        indicators
    };
}

/**
 * Check if Hermes JavaScript engine is being used
 * (Not a security issue, just informational)
 */
function isHermesEnabled(): boolean {
    // @ts-ignore - HermesInternal is a global in Hermes
    return typeof HermesInternal !== 'undefined';
}

/**
 * Check if the app might be running in an insecure environment
 * Note: True jailbreak/root detection requires native modules
 */
function checkEnvironmentSecurity(): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Debug mode check
    if (isDebugMode()) {
        issues.push({
            id: 'debug_mode',
            level: 'warning',
            title: 'Chế độ phát triển',
            description: 'Ứng dụng đang chạy ở chế độ phát triển. Một số tính năng bảo mật có thể bị tắt.',
            icon: 'bug-outline'
        });
    }

    // Emulator check
    const emulatorCheck = checkEmulatorIndicators();
    if (emulatorCheck.isLikelyEmulator && emulatorCheck.indicators.length > 0) {
        issues.push({
            id: 'emulator',
            level: 'info',
            title: 'Môi trường phát triển',
            description: 'Phát hiện môi trường phát triển. Khuyến nghị sử dụng thiết bị thật để bảo mật tốt nhất.',
            icon: 'hardware-chip-outline'
        });
    }

    return issues;
}

/**
 * Check for potential security concerns with biometric setup
 */
function checkBiometricSecurity(): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Note: These checks would require native modules for accurate detection
    // This is a placeholder for the security check structure

    return issues;
}

/**
 * Check network security
 */
function checkNetworkSecurity(): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // In a production app, you might check:
    // - Certificate pinning status
    // - VPN detection
    // - Proxy detection

    return issues;
}

/**
 * Perform all security checks and return results
 */
export async function performSecurityChecks(): Promise<SecurityCheckResult> {
    const allIssues: SecurityIssue[] = [];

    // Environment checks
    allIssues.push(...checkEnvironmentSecurity());

    // Biometric security checks
    allIssues.push(...checkBiometricSecurity());

    // Network security checks
    allIssues.push(...checkNetworkSecurity());

    // Calculate security score
    let score = 100;
    for (const issue of allIssues) {
        switch (issue.level) {
            case 'critical':
                score -= 30;
                break;
            case 'warning':
                score -= 15;
                break;
            case 'info':
                score -= 5;
                break;
        }
    }
    score = Math.max(0, score);

    return {
        isSecure: allIssues.filter(i => i.level === 'critical').length === 0,
        issues: allIssues,
        score
    };
}

/**
 * Check if user has acknowledged security warnings
 */
export async function hasAcknowledgedWarnings(): Promise<boolean> {
    try {
        const ack = await SecureStore.getItemAsync(SECURITY_WARNING_ACK_KEY);
        if (!ack) return false;

        const data = JSON.parse(ack);
        // Acknowledgment expires after 30 days
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        return Date.now() - data.timestamp < thirtyDays;
    } catch {
        return false;
    }
}

/**
 * Save user acknowledgment of security warnings
 */
export async function acknowledgeWarnings(issueIds: string[]): Promise<void> {
    const data = {
        issueIds,
        timestamp: Date.now()
    };
    await SecureStore.setItemAsync(SECURITY_WARNING_ACK_KEY, JSON.stringify(data));
}

/**
 * Clear security warning acknowledgment
 */
export async function clearAcknowledgment(): Promise<void> {
    await SecureStore.deleteItemAsync(SECURITY_WARNING_ACK_KEY);
}

/**
 * Get security level color for UI
 */
export function getSecurityLevelColor(level: SecurityWarningLevel): string {
    switch (level) {
        case 'critical':
            return '#EF4444'; // Red
        case 'warning':
            return '#F59E0B'; // Amber
        case 'info':
            return '#3B82F6'; // Blue
        default:
            return '#6B7280'; // Gray
    }
}

/**
 * Get security score color for UI
 */
export function getSecurityScoreColor(score: number): string {
    if (score >= 80) return '#22C55E'; // Green
    if (score >= 60) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
}

/**
 * Format security score for display
 */
export function formatSecurityScore(score: number): string {
    if (score >= 80) return 'Tốt';
    if (score >= 60) return 'Trung bình';
    return 'Cần cải thiện';
}
