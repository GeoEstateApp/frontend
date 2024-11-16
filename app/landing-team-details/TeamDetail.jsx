import React, { useState, useRef, useEffect } from "react";
import { View, Image, Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import logoImage from "../../assets/images/favicon.png";

function TeamDetail({ teamMembers }) {
    const radius = 190;
    const angleStep = (2 * Math.PI) / teamMembers.length;
    const [selectedIndex, setSelectedIndex] = useState(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    //bg particles
    const generateParticles = () => {
        let particles = [];
        for (let i = 0; i < 50; i++) {
            const xPos = Math.random() * 1000 - 250;
            const yPos = Math.random() * 600 - 200;
            particles.push(
                <Animated.View
                    key={i}
                    style={[
                        styles.particle,
                        {
                            left: xPos,
                            top: yPos,
                            opacity: Math.random(),
                        },
                    ]}
                />
            );
        }
        return particles;
    };

    //team logo animation
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim]);

    return (
        <View style={styles.Tcontainer}>
            <View style={styles.particlesBackground}>{generateParticles()}</View>

            <View style={styles.teamContainer}>
                {/* display logo */}
                <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <Image source={logoImage} style={styles.logoImage} />
                </Animated.View>

                {/* display profile images */}
                {teamMembers.map((member, index) => {
                    const angle = index * angleStep;
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);

                    return (
                        <View
                            key={index}
                            style={[
                                styles.profilePosition,
                                { transform: [{ translateX: x }, { translateY: y }] },
                            ]}
                        >
                            <Image
                                source={{ uri: member.image }}
                                style={[
                                    styles.profileImage,
                                    selectedIndex === index && styles.highlightedProfile,
                                ]}
                            />
                            {selectedIndex === index && (
                                <View style={styles.tooltip}>
                                    <Text style={styles.roleText}>{member.role}</Text>
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>

            {/* members' names */}
            <View style={styles.namesList}>
                {teamMembers.map((member, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => setSelectedIndex(index)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onMouseLeave={() => setSelectedIndex(null)}
                    >
                        <View style={styles.nameContainer}>
                            <View style={styles.dashUnderlineContainer}>
                                {(selectedIndex === index || selectedIndex === index) && (
                                    <View style={styles.leftDash} />
                                )}
                                <Text
                                    style={[
                                        styles.nameItem,
                                        selectedIndex === index && styles.highlightedName,
                                    ]}
                                >
                                    {member.name}
                                </Text>
                            </View>
                            {selectedIndex === index && <View style={styles.underline} />}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    Tcontainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    particlesBackground: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
    particle: {
        position: "relative",
        width: 5,
        height: 5,
        borderRadius: 4,
        backgroundColor: "rgba(0, 122, 255, 0.7)",
    },
    teamContainer: {
        minHeight: "70vh",
        minWidth: "50vw",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        marginRight: 50,
    },
    logoContainer: {
        position: "absolute",
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
    },
    logoImage: {
        width: 100,
        height: 100,
        borderRadius: 40,
    },
    profilePosition: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: "#007AFF",
    },
    highlightedProfile: {
        borderColor: "#007AFF",
        transform: [{ scale: 1.1 }],
    },
    tooltip: {
        position: "absolute",
        top: 70,
        backgroundColor: "#007AFF",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
        alignItems: "center",
        zIndex: 10,
    },
    roleText: {
        color: "#fff",
        fontSize: 12,
    },
    namesList: {
        justifyContent: "center",
        paddingLeft: 20,
    },
    nameContainer: {
        flexDirection: "column",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    dashUnderlineContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    leftDash: {
        width: 20,
        height: 2,
        backgroundColor: "#007AFF", 
        marginRight: 5,
    },
    nameItem: {
        fontSize: 20,
        color: "#fff",
    },
    highlightedName: {
        color: "#007AFF",
        fontWeight: "bold",
    },
    underline: {
        height: 1, 
        backgroundColor: "rgba(71, 145, 115, 0.3)",
        marginTop: 5, 
        alignSelf: "stretch", 
    },
});

export default TeamDetail;

