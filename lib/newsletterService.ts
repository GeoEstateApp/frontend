import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import Toast from 'react-native-toast-message';

export const subscribeToNewsletter = async (email: string) => {
  try {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Check if email already exists
    const q = query(collection(db, 'newsletter_subscribers'), where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error('Email already subscribed');
    }

    // Add new subscriber
    await addDoc(collection(db, 'newsletter_subscribers'), {
      email,
      subscribedAt: new Date(),
      status: 'active'
    });

    // Show success toast
    Toast.show({
      type: 'success',
      text1: 'Subscription Successful!',
      text2: 'Thank you for subscribing to our newsletter.',
    });

    return true;
  } catch (error) {
    // Show error toast
    Toast.show({
      type: 'error',
      text1: 'Subscription Failed',
      text2: error instanceof Error ? error.message : 'Please try again',
    });

    console.error('Newsletter subscription error:', error);
    throw error;
  }
};
