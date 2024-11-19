import React, { useState, useRef, useEffect } from "react";
import {View, Image, Animated, StyleSheet, Text, TouchableOpacity, Platform, Easing} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import logoImage from "../../assets/images/favicon.png";

function TeamDetail({ teamMembers }) {
  const radius = 190;
  const angleStep = (2 * Math.PI) / teamMembers.length;
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hoverAnim] = useState(() =>
    teamMembers.map(() => new Animated.Value(1))
  );
  const [tooltipOpacity] = useState(() =>
    teamMembers.map(() => new Animated.Value(0))
  );
  const [underlineWidth] = useState(() =>
    teamMembers.map(() => new Animated.Value(0))
  );
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 1000,
        delay: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  // Team logo animations
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

  // hover enter/leave animations
  const handleMouseEnter = (index) => {
    Animated.timing(hoverAnim[index], {
      toValue: 1.2,
      duration: 300,
      useNativeDriver: true,
    }).start();
    Animated.timing(tooltipOpacity[index], {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    Animated.timing(underlineWidth[index], {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setSelectedIndex(index);
  };

  const handleMouseLeave = (index) => {
    Animated.timing(hoverAnim[index], {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    Animated.timing(tooltipOpacity[index], {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    Animated.timing(underlineWidth[index], {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setSelectedIndex(-1);
  };

  // Particles in background
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

  return (
    <View style={styles.Tcontainer}>
      
      <View style={styles.particlesBackground}>{generateParticles()}</View> 
      
      <Animated.View style={[styles.headerContainer, {
        opacity: fadeAnim,
        transform: [{ translateY }]
      }]}>
        <Text style={styles.headerSubtitle}>MEET OUR TEAM</Text>
        <Text style={styles.headerTitle}>The People Behind GeoEstate</Text>
      </Animated.View>

      <View style={styles.contentContainer}>
        <View style={styles.namesList}>
          {teamMembers.map((member, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedIndex(index)}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={() => handleMouseLeave(index)}
            >
              <View style={styles.nameContainer}>
                <View style={styles.dashUnderlineContainer}>
                  <Animated.View
                    style={[
                      styles.leftDash,
                      {
                        width: underlineWidth[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 20],
                        }),
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.nameItem,
                      selectedIndex === index && styles.highlightedName,
                    ]}
                    numberOfLines={1}
                  >
                    {member.name}
                  </Text>
                </View>
                <Animated.View
                  style={[
                    styles.underline,
                    {
                      transform: [
                        {
                          scaleX: underlineWidth[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.teamContainer}>
          <Animated.View
            style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}
          >
            <Image source={logoImage} style={styles.logoImage} />
          </Animated.View>

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
                <Animated.Image
                  source={{ uri: member.image }}
                  style={[
                    styles.profileImage,
                    { transform: [{ scale: hoverAnim[index] }] },
                  ]}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={() => handleMouseLeave(index)}
                />
                <Animated.View
                  style={[styles.tooltip, { opacity: tooltipOpacity[index] }]}
                >
                  <Text style={styles.roleText}>{member.role}</Text>
                </Animated.View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    Tcontainer: {
      position: "relative",
      width: '100%',
      overflow: "hidden",
      paddingVertical: 20,
    },
    headerContainer: {
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: -35,
    },
    headerSubtitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#007AFF',
      letterSpacing: 2,
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: Platform.select({ web: 48, default: 36 }),
      fontWeight: 'bold',
      color: '#fff',
      textAlign: 'center',
      marginBottom: 24,
    },
    headerDescription: {
      fontSize: Platform.select({ web: 18, default: 16 }),
      color: '#fff',
      opacity: 0.8,
      textAlign: 'center',
      maxWidth: 600,
      lineHeight: Platform.select({ web: 28, default: 24 }),
    },
    contentContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: '100%',
      minHeight: 600,
    },
    particlesBackground: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    particle: {
      position: "relative",
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(0, 122, 255, 0.8)",
    },
    teamContainer: {
      minHeight: "80vh",
      minWidth: "50vw",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      marginRight: 240,
      padding: 60,
    },
    logoContainer: {
      position: "absolute",
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: "blur(10px)",
      borderWidth: 2,
      borderColor: "rgba(0, 122, 255, 0.3)",
    },
    logoImage: {
      width: 110,
      height: 110,
      borderRadius: 45,
    },
    profilePosition: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
    },
    profileImage: {
      width: 80,
      height: 80,
      borderRadius: 55,
      borderWidth: 3,
      borderColor: "#007AFF",
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: "blur(8px)",
    },
    tooltip: {
      position: "absolute",
      top: 80,
      backgroundColor: "rgba(0, 122, 255, 0.95)",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      alignItems: "center",
      zIndex: 10,
      maxWidth: 180,
      textAlign: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
      transform: [{ translateY: 5 }],
    },
    roleText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "500",
      letterSpacing: 0.5,
    },
    namesList: {
      justifyContent: "center",
      paddingLeft: 40,
      minWidth: 240,
    },
    nameContainer: {
      flexDirection: "column",
      alignItems: "flex-start",
      marginBottom: 20,
      width: 240,
    },
    dashUnderlineContainer: {
      flexDirection: "row",
      alignItems: "center",
      width: '100%',
    },
    leftDash: {
      width: 20,
      height: 2,
      backgroundColor: "#007AFF",
      marginRight: 12,
      borderRadius: 1,
      flexShrink: 0,
    },
    nameItem: {
      fontSize: 20,
      color: "rgba(255, 255, 255, 0.85)",
      overflow: "hidden",
      fontWeight: "400",
      letterSpacing: 0.5,
      flexShrink: 1,
    },
    highlightedName: {
      color: "#007AFF",
      fontWeight: "600",
      transform: [{ scale: 1.05 }],
    },
    underline: {
      height: 2,
      backgroundColor: "rgba(0, 122, 255, 0.3)",
      marginTop: 8,
      width: '100%',
      alignSelf: "stretch",
      borderRadius: 1,
    },
  });
  
export default TeamDetail;
