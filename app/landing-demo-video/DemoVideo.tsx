import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, useWindowDimensions } from 'react-native';
import React, { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const VIDEO_URL = 'https://www.youtube.com/watch?v=CvFH_6DNRCY';

export default function VideoSection() {
    const { width: windowWidth } = useWindowDimensions();
    const getResponsiveWidth = () => {
        if (windowWidth < 768) return '95%';
        if (windowWidth < 1024) return '80%';
        return '60%';
    };

    const getResponsiveFontSize = (baseSize: number) => {
        if (windowWidth < 768) return baseSize * 0.8;
        if (windowWidth < 1024) return baseSize * 0.9;
        return baseSize;
    };

    const containerWidth = getResponsiveWidth();

    const styles = StyleSheet.create({
        container: {
            width: containerWidth,
            height: windowWidth < 768 ? 400 : 650,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: windowWidth < 768 ? 12 : 20,
            alignSelf: 'center',
            marginVertical: windowWidth < 768 ? 10 : 20,
        },
        demoSubtitle: {
            fontSize: getResponsiveFontSize(18),
            color: "#007AFF",
            fontWeight: "600",
            marginBottom: windowWidth < 768 ? 3 : 5,
            letterSpacing: 1,
        },
        textContainer: {
            paddingTop: windowWidth < 768 ? 10 : 20,
            alignItems: 'center',
            zIndex: 1,
            paddingHorizontal: windowWidth < 768 ? 10 : 0,
        },
        demoTitle: {
            fontSize: getResponsiveFontSize(28),
            color: '#fff',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: windowWidth < 768 ? 10 : 15,
        },
        demoDescription: {
            color: '#ccc',
            fontSize: getResponsiveFontSize(16),
            textAlign: 'center',
            marginBottom: windowWidth < 768 ? 20 : 30,
            paddingHorizontal: windowWidth < 768 ? 10 : 0,
        },
        video: {
            width: '100%',
            height: '100%',
            borderRadius: windowWidth < 768 ? 12 : 20,
        },
        pauseButton: {
            position: 'absolute',
            bottom: windowWidth < 768 ? 10 : 20,
            right: windowWidth < 768 ? 10 : 20,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: 50,
            padding: windowWidth < 768 ? 8 : 12,
            zIndex: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.textContainer}>
                <Text style={styles.demoSubtitle}>VISUAL DEMO</Text>
                <Text style={styles.demoTitle}>Step into GeoEstate</Text>
                <Text style={styles.demoDescription}>
                    Discover the future of property exploration with GeoEstate — your gateway to smarter real estate.
                </Text>
            </View>

            <WebView
                source={{ uri: VIDEO_URL }}
                style={styles.video}
                allowsFullscreenVideo={true}
                mediaPlaybackRequiresUserAction={false}
            />
        </View>
    );
}
