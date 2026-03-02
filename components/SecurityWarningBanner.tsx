import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
} from 'react-native-reanimated';
import { Circle, Text, XStack, YStack, useTheme } from 'tamagui';

import {
    SecurityCheckResult,
    SecurityIssue,
    acknowledgeWarnings,
    getSecurityLevelColor,
    getSecurityScoreColor,
    hasAcknowledgedWarnings,
    performSecurityChecks,
} from '@/services/securityCheck';

interface SecurityWarningBannerProps {
    /** Whether to show the banner */
    visible?: boolean;
    /** Callback when banner is dismissed */
    onDismiss?: () => void;
    /** Whether to auto-check on mount */
    autoCheck?: boolean;
}

/**
 * Banner component that displays security warnings
 * Shows at the top of login screen when security issues are detected
 */
export function SecurityWarningBanner({
    visible = true,
    onDismiss,
    autoCheck = true,
}: SecurityWarningBannerProps) {
    const theme = useTheme();
    const [securityResult, setSecurityResult] = useState<SecurityCheckResult | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAcknowledged, setIsAcknowledged] = useState(false);

    // Perform security check on mount
    useEffect(() => {
        if (autoCheck) {
            checkSecurity();
        }
    }, [autoCheck]);

    const checkSecurity = useCallback(async () => {
        const result = await performSecurityChecks();
        setSecurityResult(result);

        // Check if already acknowledged
        const acked = await hasAcknowledgedWarnings();
        setIsAcknowledged(acked);
    }, []);

    const handleAcknowledge = useCallback(async () => {
        if (securityResult) {
            await acknowledgeWarnings(securityResult.issues.map(i => i.id));
            setIsAcknowledged(true);
            onDismiss?.();
        }
    }, [securityResult, onDismiss]);

    const toggleExpanded = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    // Don't show if no issues or already acknowledged
    if (!visible || !securityResult || securityResult.issues.length === 0 || isAcknowledged) {
        return null;
    }

    const highestLevel = securityResult.issues.reduce((highest, issue) => {
        const levels = { critical: 3, warning: 2, info: 1 };
        return levels[issue.level] > levels[highest] ? issue.level : highest;
    }, 'info' as SecurityIssue['level']);

    const bannerColor = getSecurityLevelColor(highestLevel);
    const scoreColor = getSecurityScoreColor(securityResult.score);

    return (
        <Animated.View
            entering={SlideInDown.duration(300).springify()}
            exiting={SlideOutDown.duration(200)}
            style={styles.container}
        >
            <YStack
                backgroundColor="$secondary"
                borderRadius={12}
                borderWidth={1}
                borderColor={bannerColor}
                overflow="hidden"
            >
                {/* Header - always visible */}
                <Pressable onPress={toggleExpanded}>
                    <XStack
                        padding={12}
                        alignItems="center"
                        justifyContent="space-between"
                        backgroundColor={`${bannerColor}15`}
                    >
                        <XStack alignItems="center" gap={10}>
                            <Circle size={32} backgroundColor={`${bannerColor}30`}>
                                <Ionicons
                                    name={highestLevel === 'critical' ? 'shield-outline' : 'information-circle-outline'}
                                    size={18}
                                    color={bannerColor}
                                />
                            </Circle>
                            <YStack>
                                <Text color="$color" fontSize={13} fontWeight="600">
                                    {highestLevel === 'critical'
                                        ? 'Cảnh báo bảo mật'
                                        : highestLevel === 'warning'
                                            ? 'Lưu ý bảo mật'
                                            : 'Thông tin bảo mật'}
                                </Text>
                                <Text color="$tertiary" fontSize={11}>
                                    {securityResult.issues.length} vấn đề được phát hiện
                                </Text>
                            </YStack>
                        </XStack>

                        <XStack alignItems="center" gap={8}>
                            {/* Security score badge */}
                            <YStack alignItems="center">
                                <Text color={scoreColor} fontSize={14} fontWeight="700">
                                    {securityResult.score}
                                </Text>
                                <Text color="$tertiary" fontSize={9}>điểm</Text>
                            </YStack>

                            <Ionicons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={theme.tertiary?.val}
                            />
                        </XStack>
                    </XStack>
                </Pressable>

                {/* Expanded content */}
                {isExpanded && (
                    <Animated.View
                        entering={FadeIn.duration(200)}
                        exiting={FadeOut.duration(100)}
                    >
                        <YStack padding={12} gap={10}>
                            {/* Issue list */}
                            {securityResult.issues.map((issue, index) => (
                                <SecurityIssueItem key={issue.id} issue={issue} />
                            ))}

                            {/* Acknowledge button */}
                            <Pressable onPress={handleAcknowledge}>
                                <XStack
                                    backgroundColor="$colorBox"
                                    paddingVertical={10}
                                    paddingHorizontal={16}
                                    borderRadius={8}
                                    justifyContent="center"
                                    alignItems="center"
                                    gap={8}
                                >
                                    <Text color="$color" fontSize={13} fontWeight="500">
                                        Tôi đã hiểu
                                    </Text>
                                    <Ionicons name="checkmark" size={16} color={theme.color?.val} />
                                </XStack>
                            </Pressable>
                        </YStack>
                    </Animated.View>
                )}
            </YStack>
        </Animated.View>
    );
}

/**
 * Individual security issue item
 */
function SecurityIssueItem({ issue }: { issue: SecurityIssue }) {
    const color = getSecurityLevelColor(issue.level);

    return (
        <XStack
            backgroundColor={`${color}10`}
            padding={10}
            borderRadius={8}
            alignItems="flex-start"
            gap={10}
        >
            <Circle size={28} backgroundColor={`${color}20`}>
                <Ionicons
                    name={issue.icon as any}
                    size={14}
                    color={color}
                />
            </Circle>
            <YStack flex={1} gap={2}>
                <Text color="$color" fontSize={12} fontWeight="600">
                    {issue.title}
                </Text>
                <Text color="$tertiary" fontSize={11} lineHeight={16}>
                    {issue.description}
                </Text>
            </YStack>
        </XStack>
    );
}

/**
 * Compact security indicator for header
 */
export function SecurityIndicator({
    onPress,
}: {
    onPress?: () => void;
}) {
    const theme = useTheme();
    const [result, setResult] = useState<SecurityCheckResult | null>(null);

    useEffect(() => {
        performSecurityChecks().then(setResult);
    }, []);

    if (!result || result.issues.length === 0) {
        return null;
    }

    const color = getSecurityScoreColor(result.score);

    return (
        <Pressable onPress={onPress}>
            <Circle size={32} backgroundColor={`${color}20`} borderWidth={1} borderColor={color}>
                <Ionicons name="shield-checkmark-outline" size={16} color={color} />
            </Circle>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 8,
    },
});
