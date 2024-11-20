import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import Toast from 'react-native-toast-message';

export const subscribeToNewsletter = async (email: string) => {
  try {
    // Trim and validate email
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!trimmedEmail) {
      Toast.show({
        type: 'error',
        text1: 'Subscription Error',
        text2: 'Please enter an email address',
        visibilityTime: 3000,
      });
      return false;
    }

    if (!emailRegex.test(trimmedEmail)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
        visibilityTime: 3000,
      });
      return false;
    }

    // Check if email already exists
    const q = query(collection(db, 'newsletter_subscribers'), where('email', '==', trimmedEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      Toast.show({
        type: 'info',
        text1: 'Already Subscribed',
        text2: 'This email is already on our mailing list',
        visibilityTime: 3000,
      });
      return false;
    }

    // Add new subscriber
    await addDoc(collection(db, 'newsletter_subscribers'), {
      email: trimmedEmail,
      subscribedAt: new Date(),
      status: 'active'
    });

    // Show success toast with more details
    Toast.show({
      type: 'success',
      text1: 'Subscription Successful',
      text2: `${trimmedEmail} has been added to our newsletter`,
      visibilityTime: 3000,
    });

    return true;
  } catch (error) {
    // Detailed error handling
    const errorMessage = error instanceof Error ? error.message : 'Subscription failed';
    
    Toast.show({
      type: 'error',
      text1: 'Subscription Error',
      text2: errorMessage,
      visibilityTime: 3000,
    });

    console.error('Newsletter subscription error:', error);
    return false;
  }
};
