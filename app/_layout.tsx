import { Stack } from "expo-router"
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"

export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" /> {/* Landing Page */}
            <Stack.Screen name="explore" /> {/* Explore */}
            <Stack.Screen name="component" /> {/* Component Testings */}
            <Stack.Screen name="authentication" /> {/* Authentication */}
            <Stack.Screen name="settings" />
        </Stack>
    )
}
