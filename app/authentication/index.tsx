import { auth } from '@/lib/firebase';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword, GoogleAuthProvider, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addUser, findUserById, findUserByUsername } from '@/api/user';

interface FormData {
    email: string;
    password: string;
    confirmPassword?: string;
    fullName?: string;
    username?: string;
}

interface ValidationError {
    field: keyof FormData;
    message: string;
}

interface AuthError {
    code: string;
    message: string;
}

const CustomAlert = ({ 
    visible, 
    title, 
    message, 
    buttons,
    onClose 
}: {
    visible: boolean;
    title: string;
    message: string;
    buttons?: Array<{
        text: string;
        onPress?: () => void;
        style?: 'default' | 'cancel';
    }>;
    onClose: () => void;
}) => {
    return (
        <Modal
            transparent
            visible={visible}
            onRequestClose={onClose}
            animationType="fade"
        >
            <View style={alertStyles.overlay}>
                <View style={alertStyles.alertContainer}>
                    <Text style={alertStyles.alertTitle}>{title}</Text>
                    <Text style={alertStyles.alertMessage}>{message}</Text>
                    <View style={alertStyles.buttonContainer}>
                        {(buttons || [{ text: 'OK', onPress: onClose }]).map((button, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    alertStyles.button,
                                    button.style === 'cancel' && alertStyles.cancelButton,
                                    index > 0 && { marginLeft: 8 }
                                ]}
                                onPress={() => {
                                    button.onPress?.();
                                    onClose();
                                }}
                            >
                                <Text style={[
                                    alertStyles.buttonText,
                                    button.style === 'cancel' && alertStyles.cancelButtonText
                                ]}>
                                    {button.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const UsernameModal = ({
    visible,
    onSubmit,
    onClose,
    error,
}: {
    visible: boolean;
    onSubmit: (username: string) => void;
    onClose: () => void;
    error?: string;
}) => {
    const [username, setUsername] = useState('');

    return (
        <Modal
            transparent
            visible={visible}
            onRequestClose={onClose}
            animationType="fade"
        >
            <View style={alertStyles.overlay}>
                <View style={alertStyles.alertContainer}>
                    <Text style={alertStyles.alertTitle}>Create Username</Text>
                    <Text style={alertStyles.alertMessage}>
                        Choose a unique username for your account
                    </Text>
                    <TextInput
                        style={[styles.input, error && styles.inputError]}
                        placeholder="Enter username"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />
                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}
                    <View style={alertStyles.buttonContainer}>
                        <TouchableOpacity
                            style={alertStyles.button}
                            onPress={() => onSubmit(username)}
                        >
                            <Text style={alertStyles.buttonText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const alertStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: Platform.OS === 'web' ? 400 : '80%',
        maxWidth: 400,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 12,
    },
    alertMessage: {
        fontSize: 16,
        color: '#7f8c8d',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#2c3e50',
        minWidth: 80,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    cancelButton: {
        backgroundColor: '#e9ecef',
    },
    cancelButtonText: {
        color: '#2c3e50',
    },
});

export default function AuthScreen() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        username: '',
    });
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        buttons?: Array<{
            text: string;
            onPress?: () => void;
            style?: 'default' | 'cancel';
        }>;
    }>({
        visible: false,
        title: '',
        message: '',
    });

    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [usernameError, setUsernameError] = useState<string>();
    const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);

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
            newErrors.push({ field: 'email', message: 'Invalid email format' });
        }

        if (!formData.password) {
            newErrors.push({ field: 'password', message: 'Password is required' });
        } else if (formData.password.length < 6) {
            newErrors.push({ field: 'password', message: 'Password must be at least 6 characters' });
        }

        if (!isLogin) {
            if (!formData.confirmPassword) {
                newErrors.push({ field: 'confirmPassword', message: 'Please confirm your password' });
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
            }

            if (!formData.fullName) {
                newErrors.push({ field: 'fullName', message: 'Full name is required' });
            }

            if (!formData.username) {
                newErrors.push({ field: 'username', message: 'Username is required' });
            } else if (formData.username.length < 3) {
                newErrors.push({ field: 'username', message: 'Username must be at least 3 characters' });
            } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
                newErrors.push({ field: 'username', message: 'Username can only contain letters, numbers, and underscores' });
            }
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = async () => {
        if (isLoading) return;
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            if (isLogin) {
                const userCredential = await signInWithEmailAndPassword(
                    auth, 
                    formData.email, 
                    formData.password
                );
                
                if (!userCredential.user.emailVerified) {
                    showCustomAlert(
                        'Email Not Verified',
                        'Please check your inbox and verify your email'
                    );
                    setIsLoading(false);
                    return;
                }

                // JWT token and user ID
                const idToken = await userCredential.user.getIdToken();
                const uid = userCredential.user.uid;
                
                // user data from backend
                const response = await findUserByUsername(uid);
                if (response.error) {
                    throw new Error('Failed to get user data');
                }
                
                // tokens and username in AsyncStorage
                await AsyncStorage.setItem('idToken', idToken);
                await AsyncStorage.setItem('uid', uid);
                await AsyncStorage.setItem('username', response.username);
                
                router.push('/explore');
            } else {
                const userCredential = await createUserWithEmailAndPassword(
                    auth, 
                    formData.email, 
                    formData.password
                );
                
                await sendEmailVerification(userCredential.user);
                showCustomAlert(
                    'Success',
                    'Account created! Please check your email to verify your account.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                setIsLogin(true);
                                setFormData(prev => ({
                                    ...prev,
                                    password: '',
                                    confirmPassword: '',
                                    fullName: '',
                                    username: ''
                                }));
                            }
                        }
                    ]
                );
                return;
            }
        } catch (error) {
            const authError = error as AuthError;
            let errorMessage = 'Authentication failed. Please try again.';
            
            if (authError.code === 'auth/email-already-in-use') {
                showCustomAlert(
                    'Account Exists',
                    'This email is already registered. Would you like to sign in instead?',
                    [
                        {
                            text: 'Yes',
                            onPress: () => {
                                setIsLogin(true);
                                setFormData(prev => ({
                                    ...prev,
                                    password: '',
                                    confirmPassword: '',
                                    fullName: '',
                                    username: ''
                                }));
                            }
                        },
                        {
                            text: 'No',
                            style: 'cancel'
                        }
                    ]
                );
                return;
            }
            
            // error cases
            switch (authError.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'User not found.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Invalid password.';
                    break;
            }
            
            showCustomAlert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUsernameSubmit = async (username: string) => {
        try {
            if (!pendingGoogleUser) return;

            if (!username) {
                setUsernameError('Username is required');
                return;
            }

            if (username.length < 3) {
                setUsernameError('Username must be at least 3 characters');
                return;
            }

            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                setUsernameError('Username can only contain letters, numbers, and underscores');
                return;
            }

            const response = await addUser({
                userid: pendingGoogleUser.uid,
                name: pendingGoogleUser.displayName || '',
                username: username,
                zipcode: '00000',
                status: 'active'
            });

            if (response.error === 'USERNAME_TAKEN') {
                setUsernameError('This username is already taken');
                return;
            }

            if (response.error) {
                throw new Error(response.message || 'Failed to create user profile');
            }

            // success
            setShowUsernameModal(false);
            setPendingGoogleUser(null);
            router.push('/explore');
        } catch (error: any) {
            console.error('Username creation error:', error);
            setUsernameError(error.message);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setIsGoogleLoading(true);
            const result = await signInWithPopup(auth, new GoogleAuthProvider());
            if (!result) {
                throw new Error('Google sign in failed');
            }
        
            // store tokens
            const idToken = await result.user.getIdToken();
            await AsyncStorage.setItem("idToken", idToken);
            await AsyncStorage.setItem("uid", result.user.uid);

            // user exists and has a username
            const existingUser = await findUserById(result.user.uid);
            console.log('Existing user check:', existingUser);
            
            if (!existingUser.error && existingUser.username && existingUser.username.length > 0) {
                // user exists and has a username
                await AsyncStorage.setItem("username", existingUser.username);
                router.push('/explore');
                return;
            }

            // user doesn't exist or doesn't have a username
            const response = await addUser({
                userid: result.user.uid,
                name: result.user.displayName || '',
                username: '', // Empty username for now
                zipcode: '00000',
                status: 'active'
            });

            if (response.error && response.error !== 'USERNAME_REQUIRED') {
                throw new Error(response.message || 'Failed to create user profile');
            }

            setPendingGoogleUser(result.user);
            setShowUsernameModal(true);
            
        } catch (error: any) {
            console.error('Google sign in error:', error);
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: error.message || 'Failed to sign in with Google'
            });
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleSignup = async () => {
        if (!validateForm()) return;

        try {
            setIsLoading(true);
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // store tokens in AsyncStorage
            const idToken = await user.getIdToken();
            await AsyncStorage.setItem("idToken", idToken);
            await AsyncStorage.setItem("uid", user.uid);
            await AsyncStorage.setItem("username", formData.username || '');

            // send verification email
            await sendEmailVerification(user);

            // add user to backend
            const response = await addUser({
                userid: user.uid,
                name: formData.fullName || '',
                username: formData.username || '',
                zipcode: '00000', // Default zipcode
                status: 'active'
            });

            if (response.error === 'USERNAME_TAKEN') {
                setErrors([{ field: 'username', message: 'Username is already taken' }]);
                // delete the Firebase user since we couldn't create the
                // backend user
                await user.delete();
                await AsyncStorage.removeItem("idToken");
                await AsyncStorage.removeItem("uid");
                setAlertConfig({
                    visible: true,
                    title: 'Error',
                    message: 'This username is already taken. Please choose a different one.',
                });
                return;
            }

            if (response.error) {
                // clean up if backend creation failed
                await user.delete();
                await AsyncStorage.removeItem("idToken");
                await AsyncStorage.removeItem("uid");
                throw new Error(response.message || 'Failed to create user profile');
            }

            // show success message
            setAlertConfig({
                visible: true,
                title: 'Success!',
                message: 'Account created successfully. Please check your email for verification.',
                buttons: [
                    {
                        text: 'OK',
                        onPress: () => {
                            setIsLogin(true);
                            setFormData({
                                email: '',
                                password: '',
                                confirmPassword: '',
                                fullName: '',
                                username: '',
                            });
                        }
                    }
                ]
            });
        } catch (error: any) {
            console.error('Signup error:', error);
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: error.message || 'Failed to create account',
            });
        } finally {
            setIsLoading(false);
        }
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
                username: ''
            });
            startEntryAnimation();
        });
    };

    const hasError = (field: keyof FormData) =>
        errors.some(error => error.field === field);

    const getErrorMessage = (field: keyof FormData) =>
        errors.find(error => error.field === field)?.message;

    const showCustomAlert = (title: string, message: string, buttons?: any[]) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            buttons
        });
    };

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
                            <>
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
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Username</Text>
                                    <TextInput
                                        style={[styles.input, hasError('username') && styles.inputError]}
                                        placeholder="Enter your username"
                                        value={formData.username}
                                        onChangeText={(text) => setFormData({...formData, username: text})}
                                        placeholderTextColor="#95a5a6"
                                    />
                                    {hasError('username') && (
                                        <Text style={styles.errorText}>{getErrorMessage('username')}</Text>
                                    )}
                                </View>
                            </>
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
                            onPress={isLogin ? handleSubmit : handleSignup}
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
            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
            <UsernameModal
                visible={showUsernameModal}
                onSubmit={handleUsernameSubmit}
                onClose={() => {
                    setShowUsernameModal(false);
                    setPendingGoogleUser(null);
                }}
                error={usernameError}
            />
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