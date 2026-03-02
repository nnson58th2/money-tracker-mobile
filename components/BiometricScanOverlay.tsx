import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    cancelAnimation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { Circle, Text, YStack, useTheme } from 'tamagui';

import { BiometricType } from '@/services/biometricAuth';
import { getBiometricLabel } from '@/utils/formatting';

interface BiometricScanOverlayProps {
    isScanning: boolean;
    biometricType: BiometricType;
    statusText?: string;
    isLockedOut?: boolean;
    lockoutTimeText?: string;
}

/**
 * Animated overlay component for biometric scanning
 * Shows pulsing animation and scanning ring effect like banking apps
 */
export function BiometricScanOverlay({
    isScanning,
    biometricType,
    statusText,
    isLockedOut = false,
    lockoutTimeText,
}: BiometricScanOverlayProps) {
    const theme = useTheme();

    // Animation values
    const pulseScale = useSharedValue(1);
    const ringScale = useSharedValue(0.8);
    const ringOpacity = useSharedValue(0);
    const iconRotation = useSharedValue(0);
    const glowOpacity = useSharedValue(0.3);

    // Start/stop animations based on scanning state
    useEffect(() => {
        if (isScanning && !isLockedOut) {
            // Pulse animation for the icon container
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.08, { duration: 600, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            );

            // Expanding ring animation
            ringScale.value = withRepeat(
                withSequence(
                    withTiming(0.8, { duration: 0 }),
                    withTiming(1.5, { duration: 1200, easing: Easing.out(Easing.ease) })
                ),
                -1,
                false
            );

            ringOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.6, { duration: 0 }),
                    withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) })
                ),
                -1,
                false
            );

            // Subtle glow pulsing
            glowOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.2, { duration: 800, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            );

            // Subtle icon rotation for fingerprint
            if (biometricType === 'fingerprint') {
                iconRotation.value = withRepeat(
                    withSequence(
                        withTiming(5, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                        withTiming(-5, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                        withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) })
                    ),
                    -1,
                    false
                );
            }
        } else {
            // Reset animations
            cancelAnimation(pulseScale);
            cancelAnimation(ringScale);
            cancelAnimation(ringOpacity);
            cancelAnimation(iconRotation);
            cancelAnimation(glowOpacity);

            pulseScale.value = withTiming(1, { duration: 200 });
            ringScale.value = withTiming(0.8, { duration: 200 });
            ringOpacity.value = withTiming(0, { duration: 200 });
            iconRotation.value = withTiming(0, { duration: 200 });
            glowOpacity.value = withTiming(0.3, { duration: 200 });
        }

        return () => {
            cancelAnimation(pulseScale);
            cancelAnimation(ringScale);
            cancelAnimation(ringOpacity);
            cancelAnimation(iconRotation);
            cancelAnimation(glowOpacity);
        };
    }, [isScanning, isLockedOut, biometricType]);

    // Animated styles
    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ringScale.value }],
        opacity: ringOpacity.value,
    }));

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${iconRotation.value}deg` }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    // Determine colors based on state
    const primaryColor = isLockedOut
        ? theme.red?.val || '#EF4444'
        : theme.success?.val || '#22C55E';

    const iconName = biometricType === 'fingerprint' ? 'fingerprint' : 'face-recognition';
    const label = getBiometricLabel(biometricType);

    return (
        <YStack alignItems="center" gap={16} marginVertical={20}>
            {/* Main icon container with animations */}
            <View style={styles.container}>
                {/* Expanding ring effect */}
                <Animated.View
                    style={[
                        styles.ring,
                        ringStyle,
                        { borderColor: primaryColor }
                    ]}
                />

                {/* Glow effect */}
                <Animated.View
                    style={[
                        styles.glow,
                        glowStyle,
                        { backgroundColor: primaryColor }
                    ]}
                />

                {/* Main icon circle */}
                <Animated.View style={[styles.iconContainer, containerStyle]}>
                    <Circle
                        size={90}
                        backgroundColor="$secondary"
                        borderWidth={2}
                        borderColor={isLockedOut ? '$red' : '$success'}
                    >
                        <Animated.View style={iconStyle}>
                            <MaterialCommunityIcons
                                name={isLockedOut ? 'lock-clock' : iconName}
                                size={45}
                                color={primaryColor}
                            />
                        </Animated.View>
                    </Circle>
                </Animated.View>

                {/* Scanning dots animation */}
                {isScanning && !isLockedOut && (
                    <ScanningDots color={primaryColor} />
                )}
            </View>

            {/* Status text */}
            <YStack alignItems="center" gap={4}>
                {isLockedOut ? (
                    <>
                        <Text color="$red" fontSize={14} fontWeight="600">
                            Tạm khóa xác thực
                        </Text>
                        {lockoutTimeText && (
                            <Text color="$tertiary" fontSize={13}>
                                Thử lại sau {lockoutTimeText}
                            </Text>
                        )}
                    </>
                ) : (
                    <>
                        <Text color="$color" fontSize={14} fontWeight="500">
                            {statusText || `Đang xác thực ${label}...`}
                        </Text>
                        <Text color="$tertiary" fontSize={12}>
                            Đặt {biometricType === 'fingerprint' ? 'ngón tay' : 'khuôn mặt'} vào vị trí
                        </Text>
                    </>
                )}
            </YStack>
        </YStack>
    );
}

/**
 * Animated scanning dots that rotate around the icon
 */
function ScanningDots({ color }: { color: string }) {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, { duration: 2000, easing: Easing.linear }),
            -1,
            false
        );

        return () => {
            cancelAnimation(rotation);
        };
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    return (
        <Animated.View style={[styles.dotsContainer, animatedStyle]}>
            {[0, 1, 2, 3].map((i) => (
                <View
                    key={i}
                    style={[
                        styles.dot,
                        {
                            backgroundColor: color,
                            opacity: 0.3 + (i * 0.2),
                            transform: [
                                { rotate: `${i * 90}deg` },
                                { translateY: -55 },
                            ],
                        },
                    ]}
                />
            ))}
        </Animated.View>
    );
}

/**
 * Countdown timer component for lockout display
 */
export function LockoutCountdown({
    remainingMs,
    onComplete,
}: {
    remainingMs: number;
    onComplete?: () => void;
}) {
    const [timeLeft, setTimeLeft] = React.useState(remainingMs);
    const theme = useTheme();

    useEffect(() => {
        setTimeLeft(remainingMs);
    }, [remainingMs]);

    useEffect(() => {
        if (timeLeft <= 0) {
            onComplete?.();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                const next = prev - 1000;
                if (next <= 0) {
                    clearInterval(timer);
                    onComplete?.();
                    return 0;
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onComplete]);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.ceil(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        if (minutes > 0) {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${seconds}s`;
    };

    // Progress for the circular indicator
    const progress = useSharedValue(1);

    useEffect(() => {
        progress.value = withTiming(timeLeft / remainingMs, {
            duration: 1000,
            easing: Easing.linear,
        });
    }, [timeLeft, remainingMs]);

    const progressStyle = useAnimatedStyle(() => {
        const strokeDashoffset = interpolate(
            progress.value,
            [0, 1],
            [251.2, 0] // Circumference of circle with r=40
        );
        return {
            strokeDashoffset,
        };
    });

    return (
        <YStack alignItems="center" gap={8}>
            <View style={styles.countdownContainer}>
                <Text
                    color="$red"
                    fontSize={24}
                    fontWeight="700"
                    fontFamily="$mono"
                >
                    {formatTime(timeLeft)}
                </Text>
            </View>
            <Text color="$tertiary" fontSize={12}>
                Vui lòng đợi trước khi thử lại
            </Text>
        </YStack>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ring: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 2,
    },
    glow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    iconContainer: {
        zIndex: 1,
    },
    dotsContainer: {
        position: 'absolute',
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dot: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    countdownContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
});
