import React, { useEffect } from "react";
import { useDevice, useLocalStorage } from "@/hooks";
import { Link } from "expo-router";
import { Button, Text, View, StyleSheet } from "react-native";
import Globe from "@/components/Globe";

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
        backgroundColor: "#f5f5f5",
        overflow: "hidden",
    },
    contentContainer: {
        position: "absolute",
        alignItems: "center",
    },
    landingText: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
        marginBottom: 20,
    },
    subText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginVertical: 10,
    },
    buttonContainer: {
        marginTop: 20,
    }
});

const DesktopLandingPage = () => (
    <View style={{ alignItems: "center" }}>
        <Text style={styles.landingText}>Welcome to GeoEstate</Text>
        <Text style={styles.subText}>
            Explore real estate properties around the world with GeoEstate.
        </Text>
        <Link href="/explore" asChild>
            <View style={styles.buttonContainer}>
                <Button title="Get Started" />
            </View>
        </Link>
    </View>
);

const MobileLandingPage = () => (
    <View style={{ alignItems: "center" }}>
        <Text style={styles.landingText}>Welcome to GeoEstate</Text>
        <Text style={styles.subText}>
            Find your next property from the comfort of your mobile device.
        </Text>
        <Link href="/explore" asChild>
            <View style={styles.buttonContainer}>
                <Button title="Get Started" />
            </View>
        </Link>
    </View>
);
