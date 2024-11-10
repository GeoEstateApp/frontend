import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';


interface FormData {
    email: string;
    password: string;
    confirmPassword?: string;
    fullName?: string;
}

interface ValidationError {
    field: keyof FormData;
    message: string;
}

export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
    });
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        startEntryAnimation();
    }, []);

    const startEntryAnimation = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const shakeError = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, {
                toValue: 10,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
                toValue: -10,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
                toValue: 10,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const validateForm = (): boolean => {
        const newErrors: ValidationError[] = [];

        if (!formData.email) {
            newErrors.push({ field: 'email', message: 'Email is required' });
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.push({ field: 'email', message: 'Email is invalid' });
        }

        if (!formData.password) {
            newErrors.push({ field: 'password', message: 'Password is required' });
        } else if (formData.password.length < 6) {
            newErrors.push({ field: 'password', message: 'Password must be at least 6 characters' });
        }

        if (!isLogin) {
            if (!formData.fullName) {
                newErrors.push({ field: 'fullName', message: 'Full name is required' });
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
            }
        }

        setErrors(newErrors);
        if (newErrors.length > 0) {
            shakeError();
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            // TODO: Implement authentication logic here
        } catch (error) {
            Alert.alert('Error', 'Authentication failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        //TODO: Implement Google sign in
    };

    const switchMode = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 30,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setIsLogin(!isLogin);
            setErrors([]);
            setFormData({
                email: '',
                password: '',
                confirmPassword: '',
                fullName: '',
            });
            startEntryAnimation();
        });
    };

    const hasError = (field: keyof FormData) =>
        errors.some(error => error.field === field);

    const getErrorMessage = (field: keyof FormData) =>
        errors.find(error => error.field === field)?.message;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        style={[
                            styles.header,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
                            },
                        ]}
                    >
                        <Text style={styles.logoText}>GeoEstate</Text>
                        <Text style={styles.subtitle}>
                            {isLogin ? 'Welcome back!' : 'Create your account'}
                        </Text>
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.formContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
                            },
                        ]}
                    >
                        {!isLogin && (
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={[styles.input, hasError('fullName') && styles.inputError]}
                                    placeholder="Enter your full name"
                                    value={formData.fullName}
                                    onChangeText={(text) => setFormData({...formData, fullName: text})}
                                    placeholderTextColor="#95a5a6"
                                />
                                {hasError('fullName') && (
                                    <Text style={styles.errorText}>{getErrorMessage('fullName')}</Text>
                                )}
                            </View>
                        )}

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={[styles.input, hasError('email') && styles.inputError]}
                                placeholder="Enter your email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={formData.email}
                                onChangeText={(text) => setFormData({...formData, email: text})}
                                placeholderTextColor="#95a5a6"
                            />
                            {hasError('email') && (
                                <Text style={styles.errorText}>{getErrorMessage('email')}</Text>
                            )}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={[styles.input, hasError('password') && styles.inputError]}
                                placeholder="Enter your password"
                                secureTextEntry
                                value={formData.password}
                                onChangeText={(text) => setFormData({...formData, password: text})}
                                placeholderTextColor="#95a5a6"
                            />
                            {hasError('password') && (
                                <Text style={styles.errorText}>{getErrorMessage('password')}</Text>
                            )}
                        </View>

                        {!isLogin && (
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <TextInput
                                    style={[styles.input, hasError('confirmPassword') && styles.inputError]}
                                    placeholder="Confirm your password"
                                    secureTextEntry
                                    value={formData.confirmPassword}
                                    onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
                                    placeholderTextColor="#95a5a6"
                                />
                                {hasError('confirmPassword') && (
                                    <Text style={styles.errorText}>{getErrorMessage('confirmPassword')}</Text>
                                )}
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.divider} />
                        </View>

                        <TouchableOpacity
                            style={[styles.googleButton, isGoogleLoading && styles.buttonDisabled]}
                            onPress={handleGoogleSignIn}
                            disabled={isGoogleLoading}
                        >
                            {isGoogleLoading ? (
                                <ActivityIndicator color="#ea4335" />
                            ) : (
                                <>
                                    <FontAwesome name="google" size={20} color="#ea4335" />
                                    <Text style={styles.googleButtonText}>
                                        Continue with Google
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.switchButton}
                            onPress={switchMode}
                        >
                            <Text style={styles.switchButtonText}>
                                {isLogin
                                    ? "Don't have an account? Sign Up"
                                    : 'Already have an account? Sign In'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#7f8c8d',
    },
    formContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 20,
        flex: 1,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#2c3e50',
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    inputError: {
        borderColor: '#e74c3c',
    },
    errorText: {
        color: '#e74c3c',
        fontSize: 12,
        marginTop: 5,
    },
    button: {
        backgroundColor: '#2c3e50',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#e9ecef',
    },
    dividerText: {
        color: '#7f8c8d',
        paddingHorizontal: 10,
        fontSize: 14,
    },
    googleButton: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    googleButtonText: {
        color: '#2c3e50',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 10,
    },
    switchButton: {
        marginTop: 20,
        alignItems: 'center',
        padding: 10,
    },
    switchButtonText: {
        color: '#3498db',
        fontSize: 14,
        fontWeight: '500',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: -10,
        marginBottom: 20,
    },
    forgotPasswordText: {
        color: '#3498db',
        fontSize: 14,
    },
});

StyleSheet.create({
    button: {
        backgroundColor: '#2c3e50',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    secondaryButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#2c3e50',
    },
    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryText: {
        color: '#2c3e50',
    },
    disabled: {
        opacity: 0.7,
    },
});
