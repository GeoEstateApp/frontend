import React from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { Search, Globe2, Building2, BarChart3, MapPin, Shield } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const translateY = React.useRef(new Animated.Value(20)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 800,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.featureCard,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY }],
                },
            ]}
        >
            <View style={styles.iconContainer}>
                <Icon size={24} color="#007AFF" />
            </View>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
        </Animated.View>
    );
};

// Sample feature data
export const FeaturesSection = () => {
    const features = [
        {
            icon: Globe2,
            title: 'Global Coverage',
            description: 'Access real estate listings from anywhere in the world with our comprehensive global database.',
        },
        {
            icon: Search,
            title: 'Smart Search',
            description: 'Find properties quickly with our advanced search and filtering system.',
        },
        {
            icon: Building2,
            title: 'Property Insights',
            description: 'Detailed property analytics and market comparisons to make informed decisions.',
        },
        {
            icon: BarChart3,
            title: 'Market Analytics',
            description: 'Real-time market trends and predictive analytics for investment opportunities.',
        },
        {
            icon: MapPin,
            title: 'Location Intel',
            description: 'Neighborhood insights, amenities, and detailed location-based information.',
        },
        {
            icon: Shield,
            title: 'Verified Listings',
            description: 'All properties are verified and validated for your peace of mind.',
        },
    ];

    return (
        <View style={styles.featuresContainer}>
            <Text style={styles.sectionTitle}>Why Choose GeoEstate</Text>
            <Text style={styles.sectionSubtitle}>
                Discover the features that make our platform unique
            </Text>
            <View style={styles.featureGrid}>
                {features.map((feature, index) => (
                    <FeatureCard
                        key={feature.title}
                        icon={feature.icon}
                        title={feature.title}
                        description={feature.description}
                        delay={index * 100}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    featuresContainer: {
        width: '100%',
        paddingVertical: 60,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    sectionTitle: {
        fontSize: Platform.select({ web: 36, default: 28 }),
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 10,
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
    },
    sectionSubtitle: {
        fontSize: Platform.select({ web: 18, default: 16 }),
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 40,
        opacity: 0.8,
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    featureGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 20,
        maxWidth: 1200,
        alignSelf: 'center',
    },
    featureCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 15,
        padding: 20,
        width: Platform.select({ web: 350, default: '100%' }),
        alignItems: 'center',
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out',
                ':hover': {
                    transform: 'translateY(-5px)',
                },
            },
        }),
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    featureDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
});