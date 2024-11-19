import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Search, Calculator, MapPin, Facebook, Instagram, Twitter, Mail, Heart, Brain, List } from "lucide-react";
import { Link, useRouter } from "expo-router";
import { Animated, View, Text, StyleSheet, Platform, TextInput, TouchableOpacity, Linking, useWindowDimensions, Easing, Pressable, ScrollView, } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import Globe from '../components/globe/Globe';
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { IconUser, IconLogin } from '@tabler/icons-react'
import { Image } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message'
import LoadingPage from "@/components/loading/LoadingPage";
import TeamDetail from "./landing-team-details/TeamDetail";
import DemoVideo from './landing-demo-video/DemoVideo';

const teamMembers = [
    { name: "Ayesha Virk", role: "Founder, Full Stack Developer", image: "https://i.pinimg.com/736x/bf/e3/28/bfe328e7402b4da30ed9b2e7eabc188e.jpg" },
    { name: "Robert Bui", role: "CEO, Backend Lead", image: "https://i.pinimg.com/736x/bf/e3/28/bfe328e7402b4da30ed9b2e7eabc188e.jpg" },
    { name: "Humera", role: "Backend Developer, DB Developer", image: "https://i.pinimg.com/736x/bf/e3/28/bfe328e7402b4da30ed9b2e7eabc188e.jpg" },
    { name: "Yaseen (Ace)", role: "Backend Developer", image: "https://i.pinimg.com/736x/bf/e3/28/bfe328e7402b4da30ed9b2e7eabc188e.jpg" },
    { name: "Aditya Sengupta", role: "Frontend Lead, Full Stack Developer", image: "https://i.pinimg.com/736x/bf/e3/28/bfe328e7402b4da30ed9b2e7eabc188e.jpg" },
    { name: "Dip", role: "Backend, Full Stack Developer", image: "https://i.pinimg.com/736x/bf/e3/28/bfe328e7402b4da30ed9b2e7eabc188e.jpg" },
    { name: "Zainab Rashid", role: "Frontend Developer, UI/UX Lead", image: "https://i.pinimg.com/736x/bf/e3/28/bfe328e7402b4da30ed9b2e7eabc188e.jpg" },
    { name: "Shelian Gladis", role: "Frontend Developer, Designer", image: "https://i.pinimg.com/736x/bf/e3/28/bfe328e7402b4da30ed9b2e7eabc188e.jpg" },
    { name: "Vikramaditya Dhumal", role: "Frontend Developer", image: "https://i.pinimg.com/736x/bf/e3/28/bfe328e7402b4da30ed9b2e7eabc188e.jpg" },
];



function HeaderNav() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user)
        })
        return () => unsubscribe()
    }, [])

    return (
        <View style={styles.headerNav}>
            <Text style={styles.headerLink}>Features</Text>
            <Text style={styles.headerLink}>About</Text>
            <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push(isLoggedIn ? '/explore' : '/authentication')}
            >
                {isLoggedIn ? (
                    <>
                        <Text style={styles.headerButtonText}>Explore</Text>
                        <ArrowRight color="white" size={24} style={{ marginLeft: 8 }} />
                    </>
                ) : (
                    <>
                        <IconLogin size={24} stroke="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.headerButtonText}>Sign In</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    )
}

export default function Index() {
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const scrollY = useRef(new Animated.Value(0)).current;
    const heroHeight = Platform.select({ web: 900, default: 700 });
    const scrollViewRef = useRef<ScrollView>(null);
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
        Toast.show({
          type: 'info',
          text1: 'Welcome to GeoEstate!',
          text2: 'Discover your perfect property',
          visibilityTime: 3000,
          autoHide: true,
          topOffset: 20,
          text1Style: { fontSize: 16, fontWeight: 'bold' },
          text2Style: { fontSize: 14 },
        });
      
        const loadingTime = 3000; 
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, loadingTime);
      
        return () => clearTimeout(timer);
      }, []);
      
  
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
        {/* display loading screen if isLoading is true */}
        {isLoading ? (
          <LoadingPage />
        ) : (
          <>
            {/* Floating Header */}
            <Animated.View style={[styles.header, { opacity: headerOpacity, paddingTop: insets.top }]}>
              <LinearGradient
                colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.headerContent}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../assets/images/favicon.png')}
                    style={styles.logo}
                  />
                  <Text style={styles.headerTitle}>GeoEstate</Text>
                </View>
                <HeaderNav />
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
  
              {/* Features Section */}
              <FeaturesSection />
  
              {/* Video Demo Section */}
              <DemoVideo />
              <WhyUsSection />
              {/* Team Section */}
              <View style={styles.teamSection}>
                <Text style={styles.teamsectionTitle}>Meet the Team</Text>
                <TeamDetail teamMembers={teamMembers} />
              </View>
              <ReviewSection />
              {/* Footer Section */}
              <Footer />
              <Toast position="top" topOffset={20} />
            </Animated.ScrollView>
          </>
        )}
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

const FeatureCard = ({ feature, index }: any) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                delay: index * 150,
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
                {feature.details.map((detail: any, idx: number) => (
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
    const sectionRef = useRef()

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
    });

    useEffect(() => {
        if (!sectionRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.4 }
        );

        observer.observe(sectionRef.current);

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
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



const WhyUsSection = () => {
    const fadeAnim = useRef(new Animated.Value(100)).current;
    const translateY = useRef(new Animated.Value(0)).current;

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

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={[styles.whyUsSection]}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)', '#000']}
                    style={StyleSheet.absoluteFillObject}
                />
                <Animated.View style={[styles.whyUsHeader, {
                    opacity: fadeAnim,
                    transform: [{ translateY }]
                }]}>
                    <Text style={styles.whyUsSubtitle}>WHY CHOOSE GEOESTATE?</Text>
                    <Text style={styles.whyUsTitle}>The Future of Real Estate Exploration</Text>
                    <Text style={styles.whyUsDescription}>
                        GeoEstate isn't just a real estate platform—it's your personalized, interactive guide to finding the perfect property. Here's why GeoEstate is the best choice for your property journey:
                    </Text>
                </Animated.View>

                <View style={styles.whyUsContentWrapper}>
                    <View style={styles.leftColumn1}>
                        <View style={styles.whyUsContent}>

                            <View style={styles.whyUsBox}>
                                <MapPin size={32} color="#007AFF" strokeWidth={1.5} />
                                <Text style={styles.whyUsItemTitle}>Immersive 3D Maps</Text>
                                <Text style={styles.whyUsItemDescription}>
                                    Explore properties like never before with photorealistic 3D maps. Get a virtual tour of the neighborhood, including nearby amenities, schools, and parks.
                                </Text>
                            </View>
                            <View style={styles.connectorLine} />

                            <View style={styles.whyUsBox}>
                                <Calculator size={32} color="#007AFF" strokeWidth={1.5} />
                                <Text style={styles.whyUsItemTitle}>Personalized Analytics</Text>
                                <Text style={styles.whyUsItemDescription}>
                                    With our Suitability Calculator, make data-driven decisions based on real-time analytics tailored to your energy efficiency, environmental impact, and accessibility needs.
                                </Text>
                            </View>
                            <View style={styles.connectorLine} />

                            <View style={styles.whyUsBox}>
                                <Facebook size={32} color="#007AFF" strokeWidth={1.5} />
                                <Text style={styles.whyUsItemTitle}>Neighbourhood Insights</Text>
                                <Text style={styles.whyUsItemDescription}>
                                    Share and view comments about the neighborhood by zipcode. Learn from locals and potential buyers to better understand your future home’s surroundings.
                                </Text>
                            </View>
                            <View style={styles.connectorLine} />

                            <View style={styles.whyUsBox}>
                                <Heart size={32} color="#007AFF" strokeWidth={1.5} />
                                <Text style={styles.whyUsItemTitle}>Favourite Your Dream Home</Text>
                                <Text style={styles.whyUsItemDescription}>
                                    Love a building? Add it to your favorites and revisit it later to compare with other options or share it with your friends.
                                </Text>
                            </View>
                            <View style={styles.connectorLine} />

                            <View style={styles.whyUsBox}>
                                <Brain size={32} color="#007AFF" strokeWidth={1.5} />
                                <Text style={styles.whyUsItemTitle}>AI-Powered Insights</Text>
                                <Text style={styles.whyUsItemDescription}>
                                    Our AI scans and summarizes comments from the neighborhood based on zip code, helping you make informed decisions with real-time sentiment analysis.
                                </Text>
                            </View>
                            <View style={styles.connectorLine} />


                        </View>
                    </View>

                    <View style={styles.rightColumn}>
                        <Image
                            source={require('../assets/images/Globe3.jpg')}
                            style={styles.whyUsImage}
                            resizeMode="cover"
                        />
                        <LinearGradient
                            colors={['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.5)']}
                            style={StyleSheet.absoluteFillObject}
                        />
                    </View>

                </View>
            </View>
        </SafeAreaView>
    );
};

const ReviewSection = () => {
    const scrollViewRef = useRef<ScrollView>(null);

    const scrollTo = (direction: 'left' | 'right') => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
                x: direction === 'left' ? 350 : -350,
                animated: true,
            });
        }
    };

    return (
        <View style={styles.mainContainer}>
            <Text style={styles.ReviewSubtitle}>Reviews</Text>
            <Text style={styles.sectionLabel}>What Our Clients Say</Text>
            <Text style={styles.tagline}>Hear about the experiences of our happy clients!</Text>

            <View style={styles.reviewContainer}>
                {/* left arrow */}
                <TouchableOpacity onPress={() => scrollTo('left')} style={[styles.arrowButton, styles.leftArrowButton]}>
                    <Ionicons name="chevron-back" size={40} color="#007AFF" />
                </TouchableOpacity>

                {/* ScrollView for reviews */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScrollContainer}
                    ref={scrollViewRef}
                    snapToInterval={350}
                    decelerationRate="fast"
                    snapToAlignment="center"
                >
                    {/* reviews */}
                    <LinearGradient
                        colors={['#2d2d2d', '#000000', '#4c4c4c']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.reviewCard}
                    >
                        <Image source={require("../assets/images/person.jpg")} style={styles.personImage} />
                        <View style={styles.reviewContent}>
                            <Text style={styles.reviewText}>
                                "GeoEstate has completely transformed the way I view real estate. The 3D maps and
                                personalized suggestions really helped me find the perfect property. I highly
                                recommend it!"
                            </Text>
                            <Text style={styles.reviewerName}>- Michael Kai</Text>
                        </View>
                    </LinearGradient>

                    <LinearGradient
                        colors={['#2d2d2d', '#000000', '#4c4c4c']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.reviewCard}
                    >
                        <Image source={require("../assets/images/person2.jpg")} style={styles.personImage} />
                        <View style={styles.reviewContent}>
                            <Text style={styles.reviewText}>
                                "The experience was outstanding! GeoEstate's user interface is smooth and intuitive.
                                The 3D map feature helped me navigate the market with ease. Definitely worth checking
                                out."
                            </Text>
                            <Text style={styles.reviewerName}>- Clara Smith</Text>
                        </View>
                    </LinearGradient>


                </ScrollView>

                {/* right arrow */}
                <TouchableOpacity onPress={() => scrollTo('right')} style={[styles.arrowButton, styles.rightArrowButton]}>
                    <Ionicons name="chevron-forward" size={40} color="#007AFF" />
                </TouchableOpacity>
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
                            <ArrowRight size={20} color="#fff" />
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
                        <Facebook
                            size={30}
                            color="white"
                            style={styles.icon}
                        />
                        <Instagram
                            size={30}
                            color="white"
                            style={styles.icon}
                        />
                        <Mail
                            size={30}
                            color="white"
                            style={styles.icon}
                        />
                        <Twitter
                            size={30}
                            color="white"
                            style={styles.icon}
                        />
                    </View>
                </View>
            </View>

            <Text style={styles.footerText}>© 2024 GeoEstate. All Rights Reserved.</Text>
        </View>
    </SafeAreaView>
);


const styles = StyleSheet.create({
    //team section styles 
    teamSection: { alignItems: 'center', paddingVertical: 40 },
    teamsectionTitle: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },


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
        height: Platform.select({ web: 80, default: 60 }),
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
        gap: 24
    },
    headerLink: {
        color: '#fff',
        fontSize: 16
    },
    headerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8
    },
    headerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 40,
        height: 40,
        marginRight: 8,
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
        fontSize: Platform.select({ web: 64, default: 40 }),
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: Platform.select({ web: 76, default: 48 }),
    },
    heroDescription: {
        fontSize: Platform.select({ web: 20, default: 16 }),
        color: '#fff',
        textAlign: 'center',
        opacity: 0.8,
        maxWidth: 600,
        marginBottom: 40,
        lineHeight: Platform.select({ web: 32, default: 24 }),
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
    featuresSectionBackground: {
        resizeMode: 'cover',

    },
    featuresSection: {
        padding: Platform.select({ web: 120, default: 80 }),
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
        fontSize: Platform.select({ web: 48, default: 36 }),
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 24,
        maxWidth: 800,
    },
    featuresDescription: {
        fontSize: Platform.select({ web: 18, default: 16 }),
        color: '#fff',
        opacity: 0.8,
        textAlign: 'center',
        maxWidth: 600,
        lineHeight: Platform.select({ web: 28, default: 24 }),
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
        width: Platform.OS === "web" ? 400 : '100%',
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
    // Why Us
    whyUsSection: {
        flex: 1,
        justifyContent: 'center',
        paddingTop: 50,
        paddingBottom: 20,
        position: 'relative',
    },
    whyUsHeader: {
        alignItems: 'center',
        paddingBottom: 20,
        paddingHorizontal: 15,
    },
    whyUsSubtitle: {
        fontSize: 18,
        color: '#007AFF',
        fontWeight: '600',
        marginBottom: 10,
        letterSpacing: 1,
    },
    whyUsTitle: {
        fontSize: 28,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    whyUsDescription: {
        color: '#ccc',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
    },
    whyUsContentWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
    },
    leftColumn1: {
        flex: 1,
        paddingRight: 15,
        paddingLeft: 30,
    },
    rightColumn: {
        flex: 1,
    },
    whyUsContent: {
        marginTop: 10,
    },
    whyUsBox: {
        backgroundColor: '#1f1f1f',
        padding: 20,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#444',
        flexDirection: 'column',
        alignItems: 'center',
    },
    connectorLine: {
        width: '100%',
        height: 1,
        backgroundColor: '#444',
        marginBottom: 20,
    },
    whyUsItemTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 15,
    },
    whyUsItemDescription: {
        fontSize: 16,
        color: '#ccc',
        marginTop: 5,
    },
    whyUsImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'cover',
    },

    //Reviews Styles
    mainContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 30,
        position: 'relative',
    },
    ReviewSubtitle: {
        fontSize: 18,
        color: "#007AFF",
        fontWeight: "600",
        marginBottom: 5,
        letterSpacing: 1,
    },
    sectionLabel: {
        fontSize: 24,
        color: "#fff",
        fontWeight: "bold",
        marginVertical: 20,
        textAlign: "center",
    },
    tagline: {
        fontSize: 16,
        color: "#ccc",
        marginBottom: 30,
        textAlign: "center",
    },
    horizontalScrollContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewCard: {
        width: 350,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 10,
        elevation: 5,
        marginRight: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    personImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 10,
        alignSelf: "center",
    },
    reviewContent: {
        alignItems: "center",
    },
    reviewText: {
        fontSize: 14,
        color: "#fff",
        textAlign: "center",
        marginBottom: 10,
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#ccc",
        textAlign: "center",
    },
    arrowButton: {
        position: 'absolute',
        top: '50%',
        zIndex: 1,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    leftArrowButton: {
        left: -75,
    },
    rightArrowButton: {
        right: -75,
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
