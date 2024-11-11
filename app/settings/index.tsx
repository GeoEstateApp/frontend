import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconArrowLeft, IconLogout } from '@tabler/icons-react'

export default function SettingsScreen() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Auth guard
  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      router.replace('/authentication')
      return
    }
    setUserEmail(user.email)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.replace('/') // route to landing page after sign out
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (!userEmail) return null // No rendering until auth check complete

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <IconArrowLeft size={24} stroke="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.userInfo}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>

        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={handleSignOut}
        >
          <IconLogout size={20} stroke="#fff" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  backButton: {
    marginRight: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  content: {
    padding: 20,
    flex: 1
  },
  userInfo: {
    marginBottom: 40
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  email: {
    fontSize: 16,
    fontWeight: '500'
  },
  signOutButton: {
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto'
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  }
})