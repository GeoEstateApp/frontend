import { AIChat, Earth, SearchBox, SidePanel, ZipPanel } from '@/components'
import { APIProvider } from '@vis.gl/react-google-maps'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useEffect, useState } from 'react'
import { TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { IconUser, IconLogin, IconFilter, IconZip, IconSparkles } from '@tabler/icons-react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Toast from 'react-native-toast-message'
import { useSidePanelStore } from '@/states/sidepanel'

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
  const [isZipcodePanelOpen, setIsZipcodePanelOpen] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)

  const { setShowPanel, showPanel } = useSidePanelStore()

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
        { showPanel && <SidePanel /> }
        { isZipcodePanelOpen && <ZipPanel /> }
        { showAIChat && <AIChat /> }

        <View style={{...styles.toggleButtonGroup, left: showPanel || isZipcodePanelOpen || showAIChat ? 420 : 20}}>
          <Pressable style={{...styles.toggleButton, backgroundColor: showPanel ? 'limegreen' : 'white'}} onPress={() => {
            setIsZipcodePanelOpen(false)
            setShowAIChat(false)
            setShowPanel(!showPanel)
          }}>
            <IconFilter size={20} strokeWidth={2} />
          </Pressable>

          <Pressable style={{...styles.toggleButton, backgroundColor: isZipcodePanelOpen ? 'limegreen' : 'white'}} onPress={() => {
            setShowPanel(false)
            setShowAIChat(false)
              setIsZipcodePanelOpen(!isZipcodePanelOpen)
            }}>
            <IconZip size={20} strokeWidth={2} />
          </Pressable>

          <Pressable style={{...styles.toggleButton, backgroundColor: 'white'}} onPress={() => {
            setIsZipcodePanelOpen(false)
            setShowPanel(false)
            setShowAIChat(!showAIChat)
            }}>
            <IconSparkles size={20} strokeWidth={2} />
          </Pressable>
        </View>
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
  },
  toggleButtonGroup: {
    position: 'absolute',
    top: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  toggleButton: {
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }
})