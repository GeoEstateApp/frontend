import React, { useState, useRef, useEffect } from "react";
import {View,Image,Animated,StyleSheet,Text,TouchableOpacity,} from "react-native";
import logoImage from "../../assets/images/favicon.png";

function TeamDetail({ teamMembers }) {
  const radius = 190;
  const angleStep = (2 * Math.PI) / teamMembers.length;
  const [selectedIndex, setSelectedIndex] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hoverAnim = useRef(
    teamMembers.map(() => new Animated.Value(1))
  ).current;
  const tooltipOpacity = useRef(
    teamMembers.map(() => new Animated.Value(0))
  ).current;
  const underlineWidth = useRef(
    teamMembers.map(() => new Animated.Value(0))
  ).current;

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
    setSelectedIndex(null);
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
      backgroundColor: "rgba(0, 122, 255, 0.8)",
    },
    teamContainer: {
      minHeight: "70vh",
      minWidth: "50vw",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      marginRight : 200
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
      width: 120,
      height: 120,
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
    tooltip: {
      position: "absolute",
      top: 70,
      backgroundColor: "#007AFF",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 5,
      alignItems: "center",
      zIndex: 10,
      maxWidth: 120, 
      textAlign: "center",
    },
    roleText: {
      color: "#fff",
      fontSize: 12,
    },
    namesList: {
      justifyContent: "center",
      paddingLeft: 1,
    },
    nameContainer: {
      flexDirection: "column",
      alignItems: "flex-start",
      marginBottom: 10,
      maxWidth: 180, 
    },
    dashUnderlineContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    leftDash: {
      width: 15,
      height: 2,
      backgroundColor: "#007AFF",
      marginRight: 5,
    },
    nameItem: {
      fontSize: 20,
      color: "#fff",
      maxWidth: 500, 
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    },
    highlightedName: {
      color: "#007AFF",
      fontWeight: "bold",
    },
    underline: {
      height: 1,
      backgroundColor: "rgba(0, 122, 255, 0.4)",
      marginTop: 5,
      width : '100%',
      alignSelf: "stretch",
    },
  });
  
export default TeamDetail;
