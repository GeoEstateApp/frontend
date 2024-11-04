import React, { useEffect, useRef } from "react";
import { useDevice, useLocalStorage } from "@/hooks";
import { Link } from "expo-router";
import {
    Animated,
    View,
    Text,
    StyleSheet,
    Platform,
    useWindowDimensions,
    Easing, Pressable,
    SafeAreaView,
} from "react-native";
import Globe from "@/components/globe/Globe";
import { LinearGradient } from 'expo-linear-gradient';
import { FeaturesSection } from "@/components/features/Features";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {ArrowRight} from "lucide-react";

export default function Index() {
    const device = useDevice();
    const [storedValue, setValue] = useLocalStorage("device", device);
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const scrollY = useRef(new Animated.Value(0)).current;
    const heroHeight = Platform.select({ web: 800, default: 600 });

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, heroHeight / 2],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    useEffect(() => {
        const handleDeviceChange = async () => {
            await setValue(device);
        };
        handleDeviceChange();
    }, [device]);

    return (
        <View style={styles.container}>
            <Animated.View style={[
                styles.header,
                {
                    opacity: headerOpacity,
                    paddingTop: insets.top,
                }
            ]}>
                <Text style={styles.headerTitle}>GeoEstate</Text>
            </Animated.View>

            <Animated.ScrollView
                style={styles.scrollView}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
            >
                <View style={[styles.heroSection, { height: heroHeight }]}>
                    <Animated.View style={[
                        styles.globeContainer,
                        {
                            transform: [{
                                translateY: scrollY.interpolate({
                                    inputRange: [-heroHeight, 0, heroHeight],
                                    outputRange: [-heroHeight/3, 0, heroHeight/2],
                                    extrapolate: 'clamp',
                                })
                            }]
                        }
                    ]}>
                        <Globe />
                    </Animated.View>
                    <LinearGradient
                        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
                        style={styles.gradient}
                    />
                    <Animated.View style={[
                        styles.contentContainer,
                        {
                            transform: [{
                                translateY: scrollY.interpolate({
                                    inputRange: [-heroHeight, 0, heroHeight],
                                    outputRange: [heroHeight/3, 0, -heroHeight/3],
                                    extrapolate: 'clamp',
                                })
                            }]
                        }
                    ]}>
                        {device === "desktop" ? <DesktopLandingPage /> : <MobileLandingPage />}
                    </Animated.View>
                </View>
                <FeaturesSection />
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: Platform.select({ web: 80, default: 60 }),
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    heroSection: {
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        position: 'relative',
    },
    globeContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        opacity: 0.8,
    },
    contentContainer: {
        position: "absolute",
        alignItems: "center",
        padding: 20,
        width: '100%',
    },
    landingText: {
        fontSize: Platform.select({ web: 48, default: 32 }),
        fontWeight: "bold",
        color: "#ffffff",
        textAlign: "center",
        marginBottom: 20,
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
    },
    subText: {
        fontSize: Platform.select({ web: 24, default: 18 }),
        color: "#ffffff",
        textAlign: "center",
        marginVertical: 10,
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
        maxWidth: 600,
        lineHeight: Platform.select({ web: 36, default: 28 }),
    },
    buttonContainer: {
        marginTop: 30,
        overflow: 'hidden',
        borderRadius: 25,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transform: 'scale(1)',
                transition: 'transform 0.2s ease-in-out',
                ':hover': {
                    transform: 'scale(1.05)',
                },
            },
        }),
    },
    button: {
        paddingHorizontal: 40,
        paddingVertical: 15,
        backgroundColor: '#007AFF',
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: Platform.select({ web: 20, default: 16 }),
        fontWeight: 'bold',
    },
});

const DesktopLandingPage = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                delay: 500,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 1000,
                delay: 500,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[
            { alignItems: "center" },
            {
                opacity: fadeAnim,
                transform: [{ translateY }],
            }
        ]}>
            <Text style={styles.landingText}>
                GeoEstate
            </Text>
            <Text style={styles.subText}>
                Experience real estate exploration like never before with our interactive global platform.
            </Text>
            <Link href="/explore" asChild>
                <Pressable style={styles.buttonContainer}>
                    <LinearGradient
                        colors={['#007AFF', '#00A3FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                    >
                        <Text style={styles.buttonText}>Start Exploring</Text>
                        <ArrowRight color="white" size={24} />
                    </LinearGradient>
                </Pressable>
            </Link>
        </Animated.View>
    );
};

const MobileLandingPage = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                delay: 500,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 1000,
                delay: 500,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
        ]).start();
    }, []);

    return (
        <SafeAreaView>
            <Animated.View style={[
                { alignItems: "center" },
                {
                    opacity: fadeAnim,
                    transform: [{ translateY }],
                }
            ]}>
                <Text style={styles.landingText}>
                    Find Your Next Home
                </Text>
                <Text style={styles.subText}>
                    Explore global real estate opportunities right from your mobile device.
                </Text>
                <Link href="/explore" asChild>
                    <Pressable style={styles.buttonContainer}>
                        <LinearGradient
                            colors={['#007AFF', '#00A3FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.button}
                        >
                            <Text style={styles.buttonText}>Get Started</Text>
                            <ArrowRight color="white" size={20} />
                        </LinearGradient>
                    </Pressable>
                </Link>
            </Animated.View>
        </SafeAreaView>
    );
};
