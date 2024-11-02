import { useDevice, useLocalStorage } from "@/hooks";
import { Link } from "expo-router";
import { useEffect } from "react";
import { Button, Text, View } from "react-native"

export default function Index() {
  const device = useDevice()
  const [storedValue, setValue] = useLocalStorage("device", device)

  useEffect(() => {
    const handleDeviceChange = async () => {
      await setValue(device)
    }

    handleDeviceChange()
  }, [device]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {device === "desktop" ? <DesktopLandingPage /> : <MobileLandingPage />}
    </View>
  );
}

const DesktopLandingPage = () => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Desktop Landing Page</Text>
      <View style={{ height: 20 }} />
      <Link href="/explore" asChild>
        <Button title="Get started" />
      </Link>
    </View>
  )
}

const MobileLandingPage = () => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Mobile Landing Page</Text>
      <View style={{ height: 20 }} />
      <Link href="/explore" asChild>
        <Button title="Get started" />
      </Link>
    </View>
  )
}