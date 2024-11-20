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
    const q = query(collection(db, 'newsletter_subscribers'), where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error('This email is already subscribed');
    }

    // Add new subscriber
    await addDoc(collection(db, 'newsletter_subscribers'), {
      email: email.toLowerCase(),
      subscribedAt: new Date(),
      status: 'active'
    });

    // Show success toast with more details
    Toast.show({
      type: 'success',
      text1: 'Newsletter Subscription',
      text2: `${email} has been added to our mailing list`,
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
    throw error;
  }
};
