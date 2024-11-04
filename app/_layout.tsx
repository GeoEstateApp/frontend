import { Stack } from "expo-router"

export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" /> {/* Landing Page */}
            <Stack.Screen name="explore" /> {/* Explore */}
            <Stack.Screen name="component" /> {/* Component Testings */}
        </Stack>
    )
}
