import { Video, ResizeMode } from 'expo-av';  
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const VIDEO_URL = require('../../assets/videos/dummy-demo.mp4');

export default function VideoSection() {
    const videoRef = useRef<Video>(null); 
    const [isPlaying, setIsPlaying] = useState(false); 
    const [isMuted, setIsMuted] = useState(false); 

    const togglePlayPause = async () => {
        if (videoRef.current) {
            if (isPlaying) {
                await videoRef.current.pauseAsync();
            } else {
                await videoRef.current.playAsync();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handlePlaybackStatusUpdate = (status: any) => {
        if (status.didJustFinish) {
            if (videoRef.current) {
                videoRef.current.setPositionAsync(0); 
                setIsPlaying(false); 
            }
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.textContainer}>
            <Text style={styles.demoSubtitle}>VISUAL DEMO</Text>
                <Text style={styles.demoTitle}>Step into GeoEstate</Text>
                <Text style={styles.demoDescription}>
                    Discover the future of property exploration with GeoEstate — your gateway to smarter real estate.
                </Text>
            </View>

            <Video
                ref={videoRef}
                source={VIDEO_URL}
                style={styles.video}
                useNativeControls={false} 
                resizeMode={ResizeMode.COVER} 
                isMuted={isMuted} 
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />

            <TouchableOpacity
                style={styles.pauseButton}
                onPress={togglePlayPause}
                activeOpacity={0.8}
            >
                <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={24}
                    color="white"
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '60%', 
        height: 650, 
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 20,  
        alignSelf: 'center', 
        marginVertical: 20, 
    },
    demoSubtitle: {
        fontSize: 18,
        color: "#007AFF",
        fontWeight: "600",
        marginBottom: 5,
        letterSpacing: 1,
    },
    textContainer: {
        paddingTop: 20, 
        alignItems: 'center',
        zIndex: 1, 
    },
    demoTitle: {
        fontSize: 28,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    demoDescription: {
        color: '#ccc',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
    },
    video: {
        width: '100%',
        height: '100%',
        borderRadius: 20,  
    },
    pauseButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', 
        borderRadius: 50,
        padding: 12,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5, 
    },
});
