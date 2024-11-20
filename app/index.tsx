import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Search, Calculator, MapPin, Facebook, Instagram, Twitter, Mail, Heart, Brain, List } from "lucide-react";
import { Link, useRouter } from "expo-router";
import { Animated, View, Text, StyleSheet, Platform, TextInput, TouchableOpacity, Linking, useWindowDimensions, Easing, Pressable, ScrollView, } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import Globe from '../components/globe/Globe';
import { auth } from '@/lib/firebase'
import { subscribeToNewsletter } from '@/lib/newsletterService'
import { onAuthStateChanged } from 'firebase/auth'
import { IconUser, IconLogin, IconBrandFacebook, IconBrandInstagram, IconMail, IconBrandTwitter, IconBrandX, IconBrandLinkedin } from '@tabler/icons-react'
import { Image } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message'
import LoadingPage from "@/components/loading/LoadingPage";
import TeamDetail from "./landing-team-details/TeamDetail";
import DemoVideo from './landing-demo-video/DemoVideo';
import { useDevice } from "@/hooks";

const teamMembers = [
    { name: "Ayesha Virk", role: "Founder, Full Stack Developer", image: "https://i.pinimg.com/736x/0a/7d/c3/0a7dc35b8155aba1008c563bbbe34441.jpg" },
    { name: "Robert Bui", role: "Product lead, Backend Lead", image: "https://i.pinimg.com/736x/c6/dd/02/c6dd02eef170fb8accaf180faf0fdea8.jpg" },
    { name: "Vikramaditya Dhumal", role: "Frontend Lead, Full Stack Developer", image: "https://i.pinimg.com/736x/79/36/6a/79366a3b921eb0c283e19b28edc80e61.jpg" },
    { name: "Humera", role: "Backend Developer, DB Developer", image: "https://i.pinimg.com/736x/9f/90/0f/9f900f10d2ffdfd34c95ae39487eff85.jpg" },
    { name: "Yaseen", role: "Backend Developer", image: "https://i.pinimg.com/736x/d6/66/88/d66688f7a1f37ba4f0448d62876e028f.jpg" },
    { name: "Aditya Sengupta", role: "Frontend, Full Stack Developer", image: "https://i.pinimg.com/736x/a0/9a/e4/a09ae493347c98b507b43e8e2bed85be.jpg" },
    { name: "Dip", role: "Backend, Full Stack Developer", image: "https://i.pinimg.com/736x/e2/89/34/e2893485506bbf68ea7ac95c1dbb4bcd.jpg" },
    { name: "Zainab Rashid", role: "Frontend Developer, UI/UX Lead", image: "https://i.pinimg.com/736x/af/c5/57/afc557911778f8935553c46f5898dd39.jpg" },
    { name: "Shelian Gladis", role: "Frontend Developer, Designer", image: "https://i.pinimg.com/474x/ff/1c/d9/ff1cd938ef943a6af3b58ec33d39a81a.jpg" },
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

            <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push(isLoggedIn ? '/explore' : '/authentication')}
            >
                {isLoggedIn ? (
                    <>
                        <Text style={styles.headerButtonText}>Get Started</Text>
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

    const device = useDevice()

    useEffect(() => {
        Toast.show({
            type: 'info',
            text1: 'Welcome to GeoEstate!',
            text2: 'Discover your perfect property',
            visibilityTime: 2000,
            autoHide: true,
            topOffset: 20,
            text1Style: { fontSize: 16, fontWeight: 'bold' },
            text2Style: { fontSize: 14 },
        });

        const loadingTime = 2000;
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
                            <TeamDetail teamMembers={teamMembers} />
                        </View>
                        {/* <ReviewSection /> */}
                        {/* Footer Section */}
                        <Footer scrollToAbout={scrollToAbout} />
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

    const device = useDevice()

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
            <Text style={[styles.heroSubtitle, {
                fontSize: device === "mobile" ? 14 : 16,
                letterSpacing: device === "mobile" ? 1 : 2
            }]}>WELCOME TO THE FUTURE OF REAL ESTATE</Text>
            <Text style={[styles.heroTitle, {
                fontSize: device === "mobile" ? 32 : 64,
                lineHeight: device === "mobile" ? 40 : 76,
                letterSpacing: device === "mobile" ? 0.5 : 1
            }]}>Discover Your Perfect Property Anywhere in the World</Text>
            <Text style={[styles.heroDescription, {
                fontSize: device === "mobile" ? 14 : 20,
                lineHeight: device === "mobile" ? 20 : 32,
                letterSpacing: device === "mobile" ? 0.25 : 0.5
            }]}>
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
                            <Text style={[styles.primaryButtonText, {
                                fontSize: device === "mobile" ? 16 : 18,
                                letterSpacing: device === "mobile" ? 0.5 : 1
                            }]}>Start Exploring</Text>
                            <ArrowRight color="white" size={24} />
                        </LinearGradient>
                    </Pressable>
                </Link>
                <Pressable style={styles.secondaryButton} onPress={scrollToAbout}>
                    <Text style={[styles.secondaryButtonText, {
                        fontSize: device === "mobile" ? 16 : 18,
                        letterSpacing: device === "mobile" ? 0.5 : 1
                    }]}>Learn More</Text>
                </Pressable>
            </View>
        </Animated.View>
    );
};

const FeatureCard = ({ feature, index }: any) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;
    const { width } = useWindowDimensions();
    const device = useDevice();

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

    const getResponsiveStyles = () => {
        if (width < 768) { // Mobile
            return {
                padding: 20,
                iconSize: 24,
                titleSize: 18,
                descriptionSize: 14,
                detailSize: 12,
                iconContainerSize: 48,
                marginBottom: 16
            };
        } else if (width < 1024) { // Tablet
            return {
                padding: 24,
                iconSize: 28,
                titleSize: 20,
                descriptionSize: 15,
                detailSize: 13,
                iconContainerSize: 56,
                marginBottom: 20
            };
        } else { // Desktop
            return {
                padding: 32,
                iconSize: 32,
                titleSize: 24,
                descriptionSize: 16,
                detailSize: 14,
                iconContainerSize: 64,
                marginBottom: 24
            };
        }
    };

    const responsive = getResponsiveStyles();

    return (
        <Animated.View style={[
            styles.featureCard,
            {
                opacity: fadeAnim,
                transform: [{ translateY }],
                padding: responsive.padding,
                width: device === "mobile" ? '100%' : 
                       device === "tablet" ? '45%' : '30%',
                minWidth: device === "mobile" ? 'auto' : 300,
            }
        ]}>
            <View style={[styles.featureIconContainer, {
                width: responsive.iconContainerSize,
                height: responsive.iconContainerSize,
                marginBottom: responsive.marginBottom
            }]}>
                <feature.icon 
                    size={responsive.iconSize} 
                    color="#007AFF" 
                    strokeWidth={1.5} 
                />
            </View>
            <Text style={[styles.featureTitle, {
                fontSize: responsive.titleSize,
                marginBottom: responsive.marginBottom / 2
            }]}>
                {feature.title}
            </Text>
            <Text style={[styles.featureDescription, {
                fontSize: responsive.descriptionSize,
                marginBottom: responsive.marginBottom
            }]}>
                {feature.description}
            </Text>
            <View style={styles.featureDetails}>
                {feature.details.map((detail: any, idx: number) => (
                    <View key={idx} style={[styles.detailItem, {
                        marginBottom: idx < feature.details.length - 1 ? 8 : 0
                    }]}>
                        <View style={styles.detailDot} />
                        <Text style={[styles.detailText, {
                            fontSize: responsive.detailSize
                        }]}>
                            {detail}
                        </Text>
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
    const sectionRef = useRef();
    const device = useDevice();
    const { width } = useWindowDimensions();

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

    const getResponsiveStyles = () => {
        if (width < 768) { // Mobile
            return {
                container: { padding: 16 },
                headerWidth: Platform.OS === 'web' ? '100%' as const : '100%' as const,
                titleSize: 24,
                subtitleSize: 14,
                descriptionSize: 14,
                gridColumns: 1
            };
        } else if (width < 1024) { // Tablet
            return {
                container: { padding: 24 },
                headerWidth: Platform.OS === 'web' ? '90%' as const : '90%' as const,
                titleSize: 26,
                subtitleSize: 15,
                descriptionSize: 15,
                gridColumns: 2
            };
        } else { // Desktop
            return {
                container: { padding: 32 },
                headerWidth: Platform.OS === 'web' ? '80%' as const : '80%' as const,
                titleSize: 28,
                subtitleSize: 16,
                descriptionSize: 16,
                gridColumns: 3
            };
        }
    };

    const responsive = getResponsiveStyles();

    const features = [
        {
            title: "Interactive Real Estate Map with Geospatial Data",
            description: "Enhanced Neighborhood Visualization: Use our features to analyze and visualize neighborhoods, such as proximity to schools, hospitals, parks, and local amenities.",
            icon: MapPin,
            details: [
                "Extensive Data Integration",
                "Interactive Points of Interest",
                "360-Degree Building Views"
            ]
        },
        {
            title: "Suitability Calculator with Custom Analytics",
            description: "Using our Suitability Calculator, you can input details about your dream property, and get a suitable match based on our algorithm.",
            icon: Calculator,
            details: [
                "Address, Neighborhood, and Building Details",
                "Unique Suitability Score",
                "Choose where points of interest to live near."
            ]
        },
        {
            title: "Zipcode Chat and Zipcode Search",
            description: "Get insights and real user information about youe dream properties neighbourhood. Helping you make informed decisions.",
            icon: Search,
            details: [
                "Unique ZipCode Chat",
                "Analytics and Insights for Zipcodes",
                "Gemini Ai for Chat Summarision"
            ]
        },
    ];

    return (
        <View style={[styles.featuresSection, responsive.container]}>
            <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)', '#000']}
                style={StyleSheet.absoluteFill}
            />
            <Animated.View style={[
                styles.featuresSectionHeader,
                {
                    opacity: fadeAnim,
                    width: responsive.headerWidth,
                    transform: [{ translateY }]
                }
            ]}>
                <Text style={[
                    styles.featuresSubtitle,
                    { fontSize: responsive.subtitleSize, textAlign: 'center' }
                ]}>
                    POWERFUL FEATURES
                </Text>
                <Text style={[
                    styles.featuresTitle,
                    { fontSize: responsive.titleSize }
                ]}>
                    Everything you need to make informed real estate decisions
                </Text>
                <Text style={[
                    styles.featuresDescription,
                    { fontSize: responsive.descriptionSize }
                ]}>
                    Discover how our comprehensive suite of tools and features can help you find,
                    analyze, and secure your ideal property.
                </Text>
            </Animated.View>

            <View style={[
                styles.featuresGrid,
                {
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: width < 768 ? 16 : 24
                }
            ]}>
                {features.map((feature, index) => (
                    <View key={index} style={{
                        width: width < 768 ? '100%' : 
                               width < 1024 ? '45%' : '30%',
                        minWidth: width < 768 ? 'auto' : 300
                    }}>
                        <FeatureCard feature={feature} index={index} />
                    </View>
                ))}
            </View>
        </View>
    );
};

const WhyUsSection = () => {
    const fadeAnim = useRef(new Animated.Value(100)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const device = useDevice();

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
                    transform: [{ translateY }],
                    paddingHorizontal: device === "mobile" ? 20 : 40
                }]}>
                    <Text style={[styles.whyUsSubtitle, {
                        fontSize: device === "mobile" ? 14 : 18
                    }]}>WHY CHOOSE GEOESTATE?</Text>
                    <Text style={[styles.whyUsTitle, {
                        fontSize: device === "mobile" ? 24 : 28
                    }]}>The Future of Real Estate Exploration</Text>
                    <Text style={[styles.whyUsDescription, {
                        fontSize: device === "mobile" ? 14 : 16
                    }]}>
                        GeoEstate isn't just a real estate platform—it's your personalized, interactive guide to finding the perfect property. Here's why GeoEstate is the best choice for your property journey:
                    </Text>
                </Animated.View>

                <View style={[styles.whyUsContentWrapper, {
                    flexDirection: device === "mobile" ? 'column' : 'row',
                    paddingHorizontal: device === "mobile" ? 20 : 40
                }]}>
                    <View style={[styles.leftColumn1, {
                        paddingRight: device === "mobile" ? 0 : 15,
                        paddingLeft: device === "mobile" ? 0 : 30
                    }]}>
                        <View style={styles.whyUsContent}>
                            {[
                                {
                                    icon: MapPin,
                                    title: "Immersive 3D Maps",
                                    description: "Explore properties like never before with Google's photorealistic 3D maps. Get a virtual tour of the neighborhood, including nearby amenities, schools, and parks."
                                },
                                {
                                    icon: Calculator,
                                    title: "Suitability Calculator",
                                    description: "With our Suitability Calculator, make data-driven decisions based on analytics tailored to your preferences, financial budget, and accessibility needs."
                                },
                                {
                                    icon: IconBrandFacebook,
                                    title: "Neighbourhood Insights",
                                    description: "Share and view comments about the neighborhood by zipcode. Learn from locals and potential buyers to better understand your future home's surroundings."
                                },
                                {
                                    icon: Heart,
                                    title: "Favourite Your Dream Home",
                                    description: "Love a building? Add it to your favorites and revisit it later to compare with other options or share it with your friends."
                                },
                                {
                                    icon: Brain,
                                    title: "AI-Powered Insights",
                                    description: "Our AI scans and summarizes comments from the neighborhood based on zip code, helping you make informed decisions with real-time sentiment analysis."
                                }
                            ].map((item, index) => (
                                <React.Fragment key={index}>
                                    <View style={[styles.whyUsBox, {
                                        padding: device === "mobile" ? 15 : 20
                                    }]}>
                                        <item.icon size={device === "mobile" ? 24 : 32} color="#007AFF" strokeWidth={1.5} />
                                        <Text style={[styles.whyUsItemTitle, {
                                            fontSize: device === "mobile" ? 18 : 22
                                        }]}>{item.title}</Text>
                                        <Text style={[styles.whyUsItemDescription, {
                                            fontSize: device === "mobile" ? 14 : 16
                                        }]}>{item.description}</Text>
                                    </View>
                                    {index < 4 && <View style={styles.connectorLine} />}
                                </React.Fragment>
                            ))}
                        </View>
                    </View>

                    {device !== "mobile" && (
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
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

// Review Section
//
// const ReviewSection = () => {
//     const scrollViewRef = useRef<ScrollView>(null);

//     const scrollTo = (direction: 'left' | 'right') => {
//         if (scrollViewRef.current) {
//             scrollViewRef.current.scrollTo({
//                 x: direction === 'left' ? 350 : -350,
//                 animated: true,
//             });
//         }
//     };

//     return (
//         <View style={styles.mainContainer}>
//             <Text style={styles.ReviewSubtitle}>REVIEWS</Text>
//             <Text style={styles.sectionLabel}>What Our Clients Say</Text>
//             <Text style={styles.tagline}>Hear about the experiences of our happy clients!</Text>

//             <View style={styles.reviewContainer}>
//                 {/* left arrow */}
//                 <TouchableOpacity onPress={() => scrollTo('left')} style={[styles.arrowButton, styles.leftArrowButton]}>
//                     <Ionicons name="chevron-back" size={40} color="#007AFF" />
//                 </TouchableOpacity>

//                 {/* ScrollView for reviews */}
//                 <ScrollView
//                     horizontal
//                     showsHorizontalScrollIndicator={false}
//                     contentContainerStyle={styles.horizontalScrollContainer}
//                     ref={scrollViewRef}
//                     snapToInterval={350}
//                     decelerationRate="fast"
//                     snapToAlignment="center"
//                 >
//                     {/* reviews */}
//                     <LinearGradient
//                         colors={['#2d2d2d', '#000000', '#4c4c4c']}
//                         start={{ x: 0, y: 0 }}
//                         end={{ x: 1, y: 1 }}
//                         style={styles.reviewCard}
//                     >
//                         <Image source={require("../assets/images/person.jpg")} style={styles.personImage} />
//                         <View style={styles.reviewContent}>
//                             <Text style={styles.reviewText}>
//                                 "GeoEstate has completely transformed the way I view real estate. The 3D maps and
//                                 personalized suggestions really helped me find the perfect property. I highly
//                                 recommend it!"
//                             </Text>
//                             <Text style={styles.reviewerName}>- Michael Kai</Text>
//                         </View>
//                     </LinearGradient>

//                     <LinearGradient
//                         colors={['#2d2d2d', '#000000', '#4c4c4c']}
//                         start={{ x: 0, y: 0 }}
//                         end={{ x: 1, y: 1 }}
//                         style={styles.reviewCard}
//                     >
//                         <Image source={require("../assets/images/person2.jpg")} style={styles.personImage} />
//                         <View style={styles.reviewContent}>
//                             <Text style={styles.reviewText}>
//                                 "The experience was outstanding! GeoEstate's user interface is smooth and intuitive.
//                                 The 3D map feature helped me navigate the market with ease. Definitely worth checking
//                                 out."
//                             </Text>
//                             <Text style={styles.reviewerName}>- Clara Smith</Text>
//                         </View>
//                     </LinearGradient>


//                 </ScrollView>

//                 {/* right arrow */}
//                 <TouchableOpacity onPress={() => scrollTo('right')} style={[styles.arrowButton, styles.rightArrowButton]}>
//                     <Ionicons name="chevron-forward" size={40} color="#007AFF" />
//                 </TouchableOpacity>
//             </View>
//         </View>
//     );
// };

const Footer = ({ scrollToAbout }: { scrollToAbout: () => void }) => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [subscriptionStatus, setSubscriptionStatus] = useState<{
        type: 'error' | 'success' | null;
        message: string;
    }>({ type: null, message: '' });
    const device = useDevice();

    const handleSubscribe = async () => {
        if (!email) {
            setSubscriptionStatus({
                type: 'error',
                message: 'Please enter an email address'
            });
            return;
        }
        try {
            await subscribeToNewsletter(email);
            setSubscriptionStatus({
                type: 'success',
                message: 'Successfully subscribed!'
            });
            setEmail('');
        } catch (error) {
            setSubscriptionStatus({
                type: 'error',
                message: 'Failed to subscribe. Please try again.'
            });
        }
    };

    return (
        <View style={styles.footerContainer}>
            <LinearGradient
                colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.98)']}
                style={StyleSheet.absoluteFill}
            />
            
            {/* Main Footer Content */}
            <View style={[styles.footerContent, { 
                flexDirection: device === 'mobile' ? 'column' : 'row',
                paddingHorizontal: device === 'mobile' ? 20 : 40
            }]}>
                {/* Left Column - Subscribe Section */}
                <View style={[styles.footerColumn, styles.subscribeSection, {
                    width: device === 'mobile' ? '100%' : '40%',
                    marginBottom: device === 'mobile' ? 40 : 0
                }]}>
                    <Image
                        source={require('../assets/images/favicon.png')}
                        style={styles.footerLogo}
                    />
                    <Text style={styles.footerLogoText}>GeoEstate</Text>
                    <Text style={styles.subscribeText}>
                        Subscribe to our newsletter to get updates on new features and releases.
                    </Text>
                    <View style={styles.subscribeInputContainer}>
                        <TextInput
                            style={styles.subscribeInput}
                            placeholder="Enter your email"
                            placeholderTextColor="#666"
                            value={email}
                            onChangeText={setEmail}
                        />
                        <TouchableOpacity onPress={handleSubscribe} style={styles.subscribeButton}>
                            <Text style={styles.subscribeButtonText}>Subscribe</Text>
                        </TouchableOpacity>
                    </View>
                    {subscriptionStatus.type && (
                        <Text style={[styles.statusText, 
                            subscriptionStatus.type === 'error' ? styles.errorText : styles.successText
                        ]}>
                            {subscriptionStatus.message}
                        </Text>
                    )}
                </View>

                {/* Right Section - Links */}
                <View style={[styles.footerLinksContainer, {
                    width: device === 'mobile' ? '100%' : '60%',
                    flexDirection: device === 'mobile' ? 'column' : 'row'
                }]}>
                    {/* Company Links */}
                    <View style={styles.linkColumn}>
                        <Text style={styles.linkHeader}>Company</Text>
                        <TouchableOpacity onPress={scrollToAbout}>
                            <Text style={styles.linkText}>About Us</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/explore')}>
                            <Text style={styles.linkText}>Explore</Text>
                        </TouchableOpacity>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>Terms & Privacy</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Support Links */}
                    <View style={styles.linkColumn}>
                        <Text style={styles.linkHeader}>Support</Text>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>Help Center</Text>
                        </TouchableOpacity>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>Contact Us</Text>
                        </TouchableOpacity>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>FAQ</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Social Links */}
                    <View style={styles.linkColumn}>
                        <Text style={styles.linkHeader}>Connect</Text>
                        <View style={styles.socialLinks}>
                            <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://www.instagram.com/geoestateapp/')}>
                                <IconBrandInstagram size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://www.linkedin.com/company/geoestateapp/')}>
                                <IconBrandLinkedin size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://x.com/geoestateapp')}>
                                <IconBrandX size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('mailto:support@geo.estate')}>
                                <IconMail size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Footer Bottom */}
            <View style={styles.footerBottom}>
                <Text style={styles.copyrightText}>
                    {`\u00A9 2024 GeoEstate. All rights reserved.`}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    //team section styles 
    teamSection: { alignItems: 'center', paddingVertical: 40 },
    teamsectionTitle: {
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        fontSize: Platform.select({ web: 56, default: 48 }),
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
        fontSize: Platform.select({ web: 28, default: 24 }),
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
        fontSize: Platform.select({ web: 18, default: 16 }),
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
        padding: Platform.select({ web: 120, default: 40 }), // Reduced padding for mobile
        position: 'relative',
        backgroundColor: '#111',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
    },
    featuresSectionHeader: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 80,
    },
    featuresSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        width: '100%',
        flex: 1,
        color: '#007AFF',
        letterSpacing: 2,
        marginBottom: 16,
    },
    featuresTitle: {
        fontSize: Platform.select({ web: 28, default: 36 }),
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 24,
    },
    featuresDescription: {
        fontSize: Platform.select({ web: 16, default: 16 }),
        color: '#fff',
        opacity: 0.8,
        textAlign: 'center',
        lineHeight: Platform.select({ web: 28, default: 24 }),
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Platform.select({ web: 32, default: 16 }), // Reduced gap for mobile
        width: '100%',
        maxWidth: 1400,
        alignSelf: 'center',
    },
    featureCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        padding: Platform.select({ web: 32, default: 24 }), // Reduced padding for mobile
        width: Platform.OS === 'web' ? 400 : '100%', // Full width on mobile
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
        height: '100%',
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
        width: Platform.select({ web: 64, default: 48 }), // Smaller icon container for mobile
        height: Platform.select({ web: 64, default: 48 }),
        borderRadius: Platform.select({ web: 20, default: 16 }),
        backgroundColor: 'rgba(0,122,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        alignSelf: 'center', // Center icon container
    },
    featureTitle: {
        fontSize: Platform.select({ web: 24, default: 20 }), // Smaller font for mobile
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center', // Center align text
    },
    featureDescription: {
        fontSize: Platform.select({ web: 16, default: 14 }), // Smaller font for mobile
        color: '#fff',
        opacity: 0.8,
        marginBottom: 24,
        lineHeight: Platform.select({ web: 24, default: 20 }), // Adjusted line height
        textAlign: 'center', // Center align text
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
        paddingBottom: 80,
        position: 'relative',
    },
    ReviewSubtitle: {
        fontSize: 18,
        color: "#007AFF",
        fontWeight: "600",
        marginBottom: 10,
        letterSpacing: 1,
    },
    sectionLabel: {
        fontSize: 24,
        color: "#fff",
        fontWeight: "bold",
        marginBottom: 15,
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
    footerContainer: {
        width: '100%',
        backgroundColor: '#000',
        paddingTop: 60,
        position: 'relative',
    },
    footerContent: {
        maxWidth: 1200,
        marginHorizontal: 'auto',
        paddingBottom: 40,
    },
    footerColumn: {
        flex: 1,
    },
    subscribeSection: {
        paddingRight: 40,
    },
    footerLogo: {
        width: 40,
        height: 40,
        marginBottom: 12,
    },
    footerLogoText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    subscribeText: {
        color: '#999',
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 22,
    },
    subscribeInputContainer: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    subscribeInput: {
        flex: 1,
        height: 44,
        backgroundColor: '#111',
        borderRadius: 8,
        paddingHorizontal: 16,
        color: '#fff',
        marginRight: 8,
    },
    subscribeButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        borderRadius: 8,
        justifyContent: 'center',
    },
    subscribeButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    footerLinksContainer: {
        justifyContent: 'space-around',
    },
    linkColumn: {
        marginBottom: 30,
    },
    linkHeader: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    linkText: {
        color: '#999',
        fontSize: 14,
        marginBottom: 12,
    },
    socialLinks: {
        flexDirection: 'row',
        gap: 16,
    },
    socialIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerBottom: {
        borderTopWidth: 1,
        borderTopColor: '#222',
        paddingVertical: 20,
        alignItems: 'center',
    },
    copyrightText: {
        color: '#666',
        fontSize: 12,
    },
    statusText: {
        fontSize: 12,
        marginTop: 8,
    },
    errorText: {
        color: '#ff4444',
    },
    successText: {
        color: '#00C851',
    },
});
