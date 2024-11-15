
import TestButtonsCommentContainer from '@/components/testbutton/commentsbutton'
import TestButtonsContainer from '@/components/testbutton/favsbutton2'
import { auth } from '@/lib/firebase'
import {
  IconArrowLeft,
  IconCamera,
  IconLock,
  IconLogout,
  IconMail
} from '@tabler/icons-react'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword, verifyBeforeUpdateEmail } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
type ModalType = 'password' | 'email' | null

export default function SettingsScreen() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [photoURL, setPhotoURL] = useState<string | null>(null)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      router.replace('/authentication')
      return
    }
    setUserEmail(user.email)
    setDisplayName(user.displayName)
    setPhotoURL(user.photoURL)
  }, [])

  // need to add firebase storage to upload the image
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    })

    if (!result.canceled) {
      setPhotoURL(result.assets[0].uri)
    }
  }

  const handleEmailChange = async () => {
    setIsLoading(true)
    setError('')
    try {
      if (!currentPassword || !newEmail) {
        throw new Error('Please fill in all fields')
      }
      if (!/\S+@\S+\.\S+/.test(newEmail)) {
        throw new Error('Please enter a valid email address')
      }

      const user = auth.currentUser
      if (!user || !user.email) throw new Error('Not authenticated')

      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await verifyBeforeUpdateEmail(user, newEmail)

      setModalType(null)
      setCurrentPassword('')
      setNewEmail('')
      Alert.alert(
        'Verification Email Sent',
        'Please check your new email to verify the change'
      )
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setError('Current password is incorrect')
      } else {
        setError('Failed to update email. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    setIsLoading(true)
    setError('')
    try {
      if (!currentPassword || !newPassword) {
        throw new Error('Please fill in all fields')
      }
      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters')
      }

      const user = auth.currentUser
      if (!user || !user.email) throw new Error('Not authenticated')

      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)

      setModalType(null)
      setCurrentPassword('')
      setNewPassword('')
      Alert.alert('Success', 'Password updated successfully')
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setError('Current password is incorrect')
      } else {
        setError('Failed to update password. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.replace('/')
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out')
    }
  }

  if (!userEmail) return null

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {displayName?.charAt(0) || userEmail?.charAt(0)}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage}>
              <IconCamera size={20} stroke="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.email}>{userEmail}</Text>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setModalType('email')}
          >
            <View style={styles.settingLeft}>
              <IconMail size={24} stroke="#666" />
            
              <TestButtonsContainer/>
              <TestButtonsCommentContainer/>
              <Text style={styles.settingText}>Change Email</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setModalType('password')}
          >
            <View style={styles.settingLeft}>
              <IconLock size={24} stroke="#666" />
              <Text style={styles.settingText}>Change Password</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
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
  profileSection: {
    alignItems: 'center',
    marginBottom: 32
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold'
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff'
  },
  email: {
    fontSize: 16,
    color: '#666'
  },
  section: {
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  settingText: {
    fontSize: 16
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20
  },
  cancelButton: {
    padding: 12
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center'
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 12
  }
})