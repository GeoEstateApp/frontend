import React, { useEffect } from "react";
import { useDevice, useLocalStorage } from "@/hooks";
import { Link } from "expo-router";
import { Text, View, StyleSheet, Platform } from "react-native";
import Globe from "@/components/Globe";
import {LinearGradient} from "expo-linear-gradient";

export default function Index() {
    const device = useDevice();
    const [storedValue, setValue] = useLocalStorage("device", device);

    useEffect(() => {
        const handleDeviceChange = async () => {
            await setValue(device);
        };
        handleDeviceChange();
    }, [device]);

    return (
        <View style={styles.container}>
            <Globe />
            <LinearGradient
                colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
                style={styles.gradient}
            />
            <View style={styles.contentContainer}>
                {device === "desktop" ? <DesktopLandingPage /> : <MobileLandingPage />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
        overflow: "hidden",
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
    },
    buttonContainer: {
        marginTop: 30,
        overflow: 'hidden',
        borderRadius: 25,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    button: {
        paddingHorizontal: 40,
        paddingVertical: 15,
        backgroundColor: '#007AFF',
        borderRadius: 25,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: Platform.select({ web: 20, default: 16 }),
        fontWeight: 'bold',
    },
});

const DesktopLandingPage = () => (
    <View style={{ alignItems: "center" }}>
        <Text style={styles.landingText}>Welcome to GeoEstate</Text>
        <Text style={styles.subText}>
            Explore real estate properties around the world with our interactive global platform.
        </Text>
        <Link href="/explore" asChild>
            <View style={styles.buttonContainer}>
                <View style={styles.button}>
                    <Text style={styles.buttonText}>Get Started</Text>
                </View>
            </View>
        </Link>
    </View>
);

const MobileLandingPage = () => (
    <View style={{ alignItems: "center" }}>
        <Text style={styles.landingText}>Welcome to GeoEstate</Text>
        <Text style={styles.subText}>
            Find your next property from anywhere in the world, right from your mobile device.
        </Text>
        <Link href="/explore" asChild>
            <View style={styles.buttonContainer}>
                <View style={styles.button}>
                    <Text style={styles.buttonText}>Get Started</Text>
                </View>
            </View>
        </Link>
    </View>
);