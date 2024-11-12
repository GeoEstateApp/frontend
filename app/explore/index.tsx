import { Earth, SearchBox, SidePanel } from '@/components'
import { APIProvider } from '@vis.gl/react-google-maps'
import { StyleSheet, Text, View } from 'react-native'
import { useEffect, useState } from 'react'
import { TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { IconUser, IconLogin } from '@tabler/icons-react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Toast from 'react-native-toast-message'

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
const GOOGLE_MAP_VERSION = 'alpha'

function HeaderButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user)
    })
    return () => unsubscribe()
  }, [])

  const handlePress = () => {
    if (isLoggedIn) {
      router.push('/settings')
    } else {
      router.push('/authentication')
    }
  }

  return (
    <TouchableOpacity 
      style={styles.headerButton}
      onPress={handlePress}
    >
      {isLoggedIn ? (
        <IconUser size={24} stroke="#000" />
      ) : (
        <IconLogin size={24} stroke="#000" />
      )}
    </TouchableOpacity>
  )
}

export default function index() {
  if (!API_KEY) {
    return (
      <View style={styles.container}>
        <Text>Missing Google Maps API Key</Text>
      </View>
    )
  }

  useEffect(() => {
    Toast.show({
      type: 'info',
      text1: 'Welcome to Explore!',
      text2: 'Use the search bar to find places',
      autoHide: true,
      visibilityTime: 5000,
      text1Style: { fontSize: 16, fontWeight: 'bold' },
      text2Style: { fontSize: 14 }
    })
  }, [])

  return (
    <View style={styles.container}>
      <HeaderButton />
      <APIProvider apiKey={API_KEY} version={GOOGLE_MAP_VERSION}>
        <Earth />
        <SearchBox />
        <SidePanel />
      </APIProvider>

      <Toast position='bottom' bottomOffset={20} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  }
})