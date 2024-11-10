import React, { useEffect, useRef } from "react";
import { ArrowRight, ChevronDown, Search, BarChart2, Home, Calculator, MapPin, Clock, Shield } from "lucide-react";
import { Link } from "expo-router";
import {
    Animated,
    View,
    Text,
    StyleSheet,
    Platform,
    TextInput,
    TouchableOpacity,
    Linking,
    useWindowDimensions,
    Easing,
    Pressable,
    SafeAreaView,
    ScrollView,
    ImageBackground,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Globe from '../components/globe/Globe';
import Icon from 'react-native-vector-icons/FontAwesome'; // Use FontAwesome or another icon set

export default function Index() {
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const scrollY = useRef(new Animated.Value(0)).current;
    const heroHeight = Platform.select({ web: 900, default: 700 });
    const scrollViewRef = useRef<ScrollView>(null);

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, heroHeight / 3],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const scrollIndicatorOpacity = scrollY.interpolate({
        inputRange: [0, heroHeight / 4],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const scrollToAbout = () => {
        scrollViewRef.current?.scrollTo({ y: heroHeight, animated: true });
    };

    return (
        <View style={styles.container}>
            {/* Floating Header */}
            <Animated.View style={[styles.header, { opacity: headerOpacity, paddingTop: insets.top }]}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>GeoEstate</Text>
                    <View style={styles.headerNav}>
                        <Text style={styles.headerLink}>Features</Text>
                        <Text style={styles.headerLink}>About</Text>
                        <Link href="/explore" asChild>
                            <Pressable style={styles.headerButton}>
                                <Text style={styles.headerButtonText}>Sign Up</Text>
                            </Pressable>
                        </Link>
                    </View>
                </View>
            </Animated.View>

            <Animated.ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
            >
                <View style={[styles.heroSection, { height: heroHeight }]}>
                    <View style={styles.globeContainer}>
                        <Globe />
                    </View>
                    <LinearGradient
                        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
                        style={styles.gradient}
                    />
                    <HeroContent scrollToAbout={scrollToAbout} />

                    <Animated.View style={[styles.scrollIndicator, { opacity: scrollIndicatorOpacity }]}>
                        <Text style={styles.scrollText}>Scroll to explore</Text>
                        <ChevronDown color="white" size={24} />
                    </Animated.View>
                </View>

                {/* Merged Footer as part of scrollable content */}
                <FeaturesSection />
                <AboutSection />
                <Footer /> {/* Footer is now part of the scrollable content */}
            </Animated.ScrollView>
        </View>
    );
}


const HeroContent = ({ scrollToAbout }: { scrollToAbout: () => void }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1200,
                delay: 500,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 1200,
                delay: 500,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.heroContent, {
            opacity: fadeAnim,
            transform: [{ translateY }],
        }]}>
            <Text style={styles.heroSubtitle}>WELCOME TO THE FUTURE OF REAL ESTATE</Text>
            <Text style={styles.heroTitle}>Discover Your Perfect Property Anywhere in the World</Text>
            <Text style={styles.heroDescription}>
                Experience real estate exploration like never before with our interactive global platform.
                Find, analyze, and invest in properties across the globe.
            </Text>
            <View style={styles.heroButtons}>
                <Link href="/explore" asChild>
                    <Pressable style={styles.primaryButton}>
                        <LinearGradient
                            colors={['#007AFF', '#00A3FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.primaryButtonText}>Start Exploring</Text>
                            <ArrowRight color="white" size={24} />
                        </LinearGradient>
                    </Pressable>
                </Link>
                <Pressable style={styles.secondaryButton} onPress={scrollToAbout}>
                    <Text style={styles.secondaryButtonText}>Learn More</Text>
                </Pressable>
            </View>
        </Animated.View>
    );
};

const FeatureCard = ({ feature, index }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                delay: 200 + index * 100,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 800,
                delay: 200 + index * 100,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[
            styles.featureCard,
            {
                opacity: fadeAnim,
                transform: [{ translateY }],
            }
        ]}>
            <View style={styles.featureIconContainer}>
                <feature.icon size={32} color="#007AFF" strokeWidth={1.5} />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
            <View style={styles.featureDetails}>
                {feature.details.map((detail, idx) => (
                    <View key={idx} style={styles.detailItem}>
                        <View style={styles.detailDot} />
                        <Text style={styles.detailText}>{detail}</Text>
                    </View>
                ))}
            </View>
            <LinearGradient
                colors={['rgba(0,122,255,0.1)', 'rgba(0,163,255,0.1)']}
                style={styles.featureGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
        </Animated.View>
    );
};

const FeaturesSection = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(30)).current;

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

    const features = [
        {
            title: "Interactive Real Estate Map with Geospatial Data",
            description: "Enhanced Neighborhood Visualization: Add layers to your map that visualize different aspects of neighborhoods, such as proximity to schools, hospitals, parks, and local amenities.",
            icon: MapPin,
            details: [
                "Real-Time Data Integration",
                "Interactive Points of Interest",
                "360-Degree Building Views"
            ]
        },
        {
            title: "Suitability Calculator with Custom Analytics for Homebuyers",
            description: "Energy Efficiency Insights: Incorporate details about the energy sources for buildings in each neighborhood, and allow users to filter for buildings powered by renewable energy.",
            icon: Calculator,
            details: [
                "Transportation & Commute Times",
                "Environmental Impact Indicators",
                "Neighborhood Vibes"
            ]
        },
        {
            title: "AI for Map Navigation and Surroundings Visualization",
            description: "Personalized Suggestions Based on User Preferences: Leverage AI to analyze users’ past searches or inputs to suggest areas, properties, or amenities that fit their needs.",
            icon: Search,
            details: [
                "Augmented Reality (AR) Layer",
                "3D Guided Tours",
                "Voice Assistance for Enhanced Interactivity"
            ]
        },
    ];

    return (
        <View style={styles.featuresSection}>
             <ImageBackground 
            source={require('../assets/images/bg1.jpg')}
            style={styles.featuresSectionBackground} 
        ></ImageBackground>
            <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)', '#000']}
                style={StyleSheet.absoluteFill}
            />
            <Animated.View style={[styles.featuresSectionHeader, {
                opacity: fadeAnim,
                transform: [{ translateY }]
            }]}>
                <Text style={styles.featuresSubtitle}>POWERFUL FEATURES</Text>
                <Text style={styles.featuresTitle}>Everything you need to make informed real estate decisions</Text>
                <Text style={styles.featuresDescription}>
                    Discover how our comprehensive suite of tools and features can help you find,
                    analyze, and secure your ideal property investment.
                </Text>
            </Animated.View>
            <View style={styles.featuresGrid}>
                {features.map((feature, index) => (
                    <FeatureCard key={index} feature={feature} index={index} />
                ))}
            </View>
        </View>
    );
};

const AboutSection = () => {
    const team = [
        {
            name: "John Doe",
            role: "Frontend",
            bio: "Student @ xyz",
            image: "/api/placeholder/"
        }
    ];

    return (
        <View style={styles.aboutSection} id="about">
            <Text style={styles.sectionTitle}>Our Team</Text>
            <Text style={styles.aboutDescription}>
                Meet the hard-working team behind GeoEstate who are revolutionizing the real estate industry.
            </Text>
            <View style={styles.teamGrid}>
                {team.map((member, index) => (
                    <View key={index} style={styles.teamMember}>
                        <img src={member.image} alt={member.name} style={styles.teamMemberImage} />
                        <Text style={styles.teamMemberName}>{member.name}</Text>
                        <Text style={styles.teamMemberRole}>{member.role}</Text>
                        <Text style={styles.teamMemberBio}>{member.bio}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const Footer = () => (
    <SafeAreaView style={styles.footer}>
      <View style={styles.footerContent}>

        <View style={styles.footerColumns}>
          <View style={styles.leftColumn}>
            <Text style={styles.startUsingLabel}>Unlock Your{"\n"}Perfect Space☺️</Text>

          <Text style={styles.emailLabel}>Subscribe</Text>
          <View style={styles.emailInputContainer}>
            <TextInput
              style={styles.emailInput}
              placeholder="Enter your email"
              placeholderTextColor="#A1A1A1"
            />
            <TouchableOpacity style={styles.arrowIconContainer}>
              <Icon name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
  
          <View style={styles.centerColumn}>
            <Text style={styles.companyLabel}>Company</Text>
            <View style={styles.underline} /> 
  
            <View style={styles.footerLinks}>
              <Text style={styles.bulletPoint}>• <Text style={styles.footerLink} onPress={() => Linking.openURL("https://www.geoestate.com/about")}>About us</Text></Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.footerLink} onPress={() => Linking.openURL("https://www.geoestate.com/terms")}>Terms and Privacy</Text></Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.footerLink} onPress={() => Linking.openURL("https://www.geoestate.com/home")}>Home</Text></Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.footerLink} onPress={() => Linking.openURL("https://www.geoestate.com/help")}>Help</Text></Text>
            </View>
          </View>
  
          <View style={styles.resourcesColumn}>
            <Text style={styles.companyLabel}>Resources</Text>
            <View style={styles.underline} /> 
  
            <View style={styles.footerLinks}>
              <Text style={styles.bulletPoint}>• <Text style={styles.footerLink} onPress={() => Linking.openURL("https://www.geoestate.com/blog")}>Blog</Text></Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.footerLink} onPress={() => Linking.openURL("https://www.geoestate.com/support")}>Support</Text></Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.footerLink} onPress={() => Linking.openURL("https://www.geoestate.com/contact")}>Contact Us</Text></Text>
            </View>
          </View>
  
          <View style={styles.followUsColumn}>
            <Text style={styles.companyLabel}>Follow Us</Text>
            <View style={styles.underline} /> 
  
            <View style={styles.iconLinks}>
              <Icon
                name="facebook"
                size={30}
                color="white"
                style={styles.icon}
                onPress={() => Linking.openURL("https://www.facebook.com")}
              />
              <Icon
                name="instagram"
                size={30}
                color="white"
                style={styles.icon}
                onPress={() => Linking.openURL("https://www.instagram.com")}
              />
              <Icon
                name="envelope"
                size={30}
                color="white"
                style={styles.icon}
                onPress={() => Linking.openURL("mailto:support@geoestate.com")}
              />
              <Icon
                name="twitter"
                size={30}
                color="white"
                style={styles.icon}
                onPress={() => Linking.openURL("https://www.twitter.com")}
              />
            </View>
          </View>
        </View>
  
          <Text style={styles.footerText}>© 2024 GeoEstate. All Rights Reserved.</Text>
      </View>
    </SafeAreaView>
  );
  
  
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
        zIndex: 1000,
    },
    headerContent: {
        height: Platform.select({web: 80, default: 60}),
        height: Platform.select({web: 80, default: 60}),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerNav: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
    },
    headerLink: {
        color: '#fff',
        fontSize: 16,
        opacity: 0.9,
    },
    headerButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    headerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    heroSection: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    globeContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    heroContent: {
        alignItems: 'center',
        padding: 24,
        maxWidth: 1200,
    },
    heroSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
        letterSpacing: 2,
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: Platform.select({web: 64, default: 40}),
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: Platform.select({web: 76, default: 48}),
    },
    heroDescription: {
        fontSize: Platform.select({web: 20, default: 16}),
        color: '#fff',
        textAlign: 'center',
        opacity: 0.8,
        maxWidth: 600,
        marginBottom: 40,
        lineHeight: Platform.select({web: 32, default: 24}),
    },
    heroButtons: {
        flexDirection: 'row',
        gap: 16,
    },
    primaryButton: {
        overflow: 'hidden',
        borderRadius: 30,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 32,
        paddingVertical: 16,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollIndicator: {
        position: 'absolute',
        bottom: 40,
        alignItems: 'center',
    },
    scrollText: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 8,
    },
    featuresSectionBackground:  {
        resizeMode: 'cover', 

    },
    featuresSection: {
        padding: Platform.select({web: 120, default: 80}),
        position: 'relative',
        backgroundColor: '#111',
    },
    featuresSectionHeader: {
        alignItems: 'center',
        marginBottom: 80,
    },
    featuresSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
        letterSpacing: 2,
        marginBottom: 16,
    },
    featuresTitle: {
        fontSize: Platform.select({web: 48, default: 36}),
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 24,
        maxWidth: 800,
    },
    featuresDescription: {
        fontSize: Platform.select({web: 18, default: 16}),
        color: '#fff',
        opacity: 0.8,
        textAlign: 'center',
        maxWidth: 600,
        lineHeight: Platform.select({web: 28, default: 24}),
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 32,
        maxWidth: 1400,
        alignSelf: 'center',
    },
    featureCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        padding: 32,
        width: Platform.select({web: 400, default: '100%'}),
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    featureGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.5,
    },
    featureIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(0,122,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    featureTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    featureDescription: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.8,
        marginBottom: 24,
        lineHeight: 24,
    },
    featureDetails: {
        gap: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    detailDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#007AFF',
    },
    detailText: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.7,
    },
    sectionTitle: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 48,
    },
    aboutSection: {
        padding: 80,
        backgroundColor: '#000',
    },
    aboutDescription: {
        fontSize: 20,
        color: '#fff',
        opacity: 0.8,
        textAlign: 'center',
        maxWidth: 800,
        marginBottom: 64,
        alignSelf: 'center',
    },
    teamGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 48,
        maxWidth: 1200,
        alignSelf: 'center',
    },
    teamMember: {
        alignItems: 'center',
        width: Platform.select({ web: 250, default: '100%' }),
    },
    teamMemberImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
    },
    teamMemberName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    teamMemberRole: {
        fontSize: 16,
        color: '#007AFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    teamMemberBio: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.8,
        textAlign: 'center',
    },

   //footer
   footer: {
    backgroundColor: '#091015',
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderTopColor: '#d1d7e0',
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    overflow: 'hidden',
  },
  footerContent: {
    alignItems: 'center',
  },
  footerColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  leftColumn: {
    flex: 2, 
    paddingRight: 10,
  },
  emailLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginLeft: 35,
  },
  emailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 32,
    width: 280, 
  },
  emailInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  arrowIconContainer: {
    paddingLeft: 10,
  },
  centerColumn: {
    flex: 1,  
    paddingHorizontal: 10,
    marginTop: 20,
  },
  resourcesColumn: {
    flex: 1, 
    paddingLeft: 10,
    marginTop: 20,
  },
  followUsColumn: {
    flex: 1,  
    paddingLeft: 10,
    marginTop: 20,
  },
  startUsingLabel: {
    fontSize: Platform.select({ web: 40, default: 27 }),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'left',
    marginBottom: 10,
    lineHeight: 40,
    marginLeft: 40,
    marginTop: 20,
    lineHeight: Platform.select({ web: 55, default: 35 }),
  },
  companyLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  underline: {
    borderBottomColor: '#007AFF',
    borderBottomWidth: 1,
    width: '30%',
    marginBottom: 10,
  },
  bulletPoint: {
    color: '#007AFF',
    marginVertical: 5,
    fontSize: 14,
  },
  socialLink: {
    color: '#007AFF',
    marginVertical: 5,
    fontSize: 14,
  },
  footerLinks: {
    flexDirection: 'column',
    marginTop: 10,
  },
  footerLink: {
    color: 'white',
    marginVertical: 5,
  },
  iconLinks: {
    flexDirection: 'row', 
    justifyContent: 'space-around',
    marginTop: 10,
    marginRight: 30,
  },
  icon: {
    padding: 10,  
    marginHorizontal: 5,  
  },
  footerText: {
    color: 'white',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
});