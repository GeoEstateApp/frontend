import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, onIdTokenChanged } from 'firebase/auth';
import { getVertexAI, getGenerativeModel } from "firebase/vertexai";

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig)
const auth = getAuth();
setPersistence(auth, browserLocalPersistence)

onIdTokenChanged(auth, async (user) => {
    if (user) {
        const token = await user.getIdToken()
        await AsyncStorage.setItem("idToken", token)
    }
})

const vertexAI = getVertexAI(app);

const instructions = "The following are comments about a zip code on a website that hosts user reviews of zip codes. Glean insights from these comments to display to the users looking to find a new zip code to move to."
const model = getGenerativeModel(vertexAI, { model: "gemini-1.5-flash", systemInstruction: instructions });

export { app, auth, model };