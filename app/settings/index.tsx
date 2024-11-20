import { auth } from '@/lib/firebase'
import {
  IconArrowLeft,
  IconCamera,
  IconLock,
  IconLogout,
  IconMail,
  IconUser,
  IconHelp,
  IconInfoCircle
} from '@tabler/icons-react'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword, verifyBeforeUpdateEmail } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Modal, TextInput, ActivityIndicator } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
type ModalType = 'password' | 'email' | 'profile' | null

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
  const [isGoogleUser, setIsGoogleUser] = useState(false)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      router.replace('/authentication')
      return
    }
    setUserEmail(user.email)
    setDisplayName(user.displayName)
    setPhotoURL(user.photoURL)
    
    // Check if user signed in with Google
    const googleProvider = user.providerData.find(
      provider => provider.providerId === 'google.com'
    )
    setIsGoogleUser(!!googleProvider)
  }, [])

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
      await AsyncStorage.clear()
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

          {isGoogleUser ? (
            <>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <IconLock size={24} stroke="#666" />
                  <View>
                    <Text style={styles.settingText}>Change Password</Text>
                    <Text style={styles.settingDescription}>Not available with Google Sign-in</Text>
                  </View>
                </View>
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <IconMail size={24} stroke="#666" />
                  <View>
                    <Text style={styles.settingText}>Change Email</Text>
                    <Text style={styles.settingDescription}>Please update through Google Account</Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => setModalType('password')}
              >
                <View style={styles.settingLeft}>
                  <IconLock size={24} stroke="#666" />
                  <Text style={styles.settingText}>Change Password</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => setModalType('email')}
              >
                <View style={styles.settingLeft}>
                  <IconMail size={24} stroke="#666" />
                  <Text style={styles.settingText}>Change Email</Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setModalType('profile')}
          >
            <View style={styles.settingLeft}>
              <IconUser size={24} stroke="#666" />
              <Text style={styles.settingText}>Edit Profile</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/')}
          >
            <View style={styles.settingLeft}>
              <IconHelp size={24} stroke="#666" />
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/')}
          >
            <View style={styles.settingLeft}>
              <IconInfoCircle size={24} stroke="#666" />
              <Text style={styles.settingText}>About GeoEstate</Text>
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

      {/* Password Change Modal */}
      <Modal
        visible={modalType === 'password'}
        transparent
        animationType="fade"
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholderTextColor="#666"
            />
            
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholderTextColor="#666"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalType(null)
                  setCurrentPassword('')
                  setNewPassword('')
                  setError('')
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handlePasswordChange}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email Change Modal */}
      <Modal
        visible={modalType === 'email'}
        transparent
        animationType="fade"
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Email</Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholderTextColor="#666"
            />
            
            <TextInput
              style={styles.input}
              placeholder="New Email"
              value={newEmail}
              onChangeText={setNewEmail}
              placeholderTextColor="#666"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalType(null)
                  setCurrentPassword('')
                  setNewEmail('')
                  setError('')
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleEmailChange}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Change Email</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Edit Modal */}
      <Modal
        visible={modalType === 'profile'}
        transparent
        animationType="fade"
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <TouchableOpacity 
              style={styles.avatarEditContainer}
              onPress={handlePickImage}
            >
              {photoURL ? (
                <Image source={{ uri: photoURL }} style={styles.avatarLarge} />
              ) : (
                <View style={[styles.avatarLarge, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarTextLarge}>
                    {displayName?.charAt(0) || userEmail?.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.cameraButtonLarge}>
                <IconCamera size={24} stroke="#fff" />
              </View>
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              placeholder="Display Name"
              value={displayName || ''}
              onChangeText={setDisplayName}
              placeholderTextColor="#666"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalType(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  // Handle profile update
                  setModalType(null)
                }}
              >
                <Text style={styles.confirmButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
    fontWeight: '500',
    marginLeft: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 16,
    textAlign: 'center',
  },
  avatarEditContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarTextLarge: {
    fontSize: 48,
    color: '#fff',
  },
  cameraButtonLarge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  }
})