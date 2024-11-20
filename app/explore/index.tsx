import { Earth, SearchBox, SidePanel, SuitabilityCalculator, ZipPanel } from '@/components'
import { AICommentsSummary } from '@/components'
import { APIProvider } from '@vis.gl/react-google-maps'
import { ActivityIndicator, Button, Image, Linking, Pressable, StyleSheet, Text, View, Animated } from 'react-native'
import { useEffect, useState } from 'react'
import LoadingPage from '@/components/loading/LoadingPage'
import { TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { IconUser, IconLogin, IconFilter, IconZip, IconSparkles, IconBed, IconBath, IconBuildingSkyscraper, IconAi, IconLiveView, IconGenderMale, IconGenderFemale, IconX, IconHeart, IconBookmark, IconMapPin } from '@tabler/icons-react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Walkthrough from './walkthrough'
import Toast from 'react-native-toast-message'
import { useSidePanelStore } from '@/states/sidepanel'
import { useSuitability } from '@/states/suitability'
import { useFavoritesPanelStore } from '@/states/favoritespanel'
import { useBucketListPanelStore } from '@/states/bucketlistpanel'
import { addToBucketList } from '@/api/bucketlist'
import BucketListPanel from '@/components/bucketlistpanel/bucketlistpanel'
import FavoritesPanel from '@/components/favoritespanel/favoritespanel'
import { useZipcodeInsights } from '@/states/zipcode_insights'

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

function HeaderButton({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter()

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
  const [isAppLoading, setIsAppLoading] = useState(true)
  const { showZipcodePanel, setShowZipcodePanel } = useZipcodeInsights()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [showNeighbourhoodInsights, setNeighbourhoodInsights] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Simulate app loading
  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setIsAppLoading(false)
    }, 1200) // Adjust time as needed

    return () => clearTimeout(loadingTimer)
  }, [])

  const { setShowPanel, toggleShowPanel, showPanel, selectedRealEstateProperty, setSelectedRealEstateProperty } = useSidePanelStore()
  const { isModalOpen } = useSuitability()

  const { showFavPanel, setShowFavPanel } = useFavoritesPanelStore()
  const { showBucketListPanel, setShowBucketListPanel } = useBucketListPanelStore()
  const [showAIChat, setShowAIChat] = useState(false)
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [showTourPrompt, setShowTourPrompt] = useState(true);

  //checking for first time users to display walkthrough feature
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      const isNewUser = await AsyncStorage.getItem('isFirstTimeUser')
      if (isNewUser === null || isNewUser === 'true') {
        setIsFirstTimeUser(true)
        await AsyncStorage.setItem('isFirstTimeUser', 'false')
      }
    }

    checkFirstTimeUser()
  }, [])

  // uncomment when developing for the walkthrough to show
  useEffect(() => {
    const isNewUser = localStorage.getItem('isFirstTimeUser') === null;
    if (isNewUser || process.env.NODE_ENV === 'development') {
      setIsFirstTimeUser(true);
      if (isNewUser) {
        localStorage.setItem('isFirstTimeUser', 'false');
      }
    }
  }, []);

  // start walkthrough 
  const handleStartTour = () => {
    setShowWalkthrough(true);
  };

  //animation for tour prompt for new users
  const pulseAnim = useState(new Animated.Value(1))[0];   
  useEffect(() => {
    if (showTourPrompt) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1, 
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showTourPrompt, pulseAnim]);



  if (!API_KEY) {
    return (
      <View style={styles.container}>
        <Text>Missing Google Maps API Key</Text>
      </View>
    )
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user)
    })
    return () => unsubscribe()
  }, [])


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

  useEffect(() => setNeighbourhoodInsights(false), [selectedRealEstateProperty])

  const handleNeighbourhoodInsightsChange = (value: boolean) => {
    setIsLoading(true)
    const interval = Math.random() * (1000 - 100) + 200

    setTimeout(() => {
      setNeighbourhoodInsights(value)
      setIsLoading(false)
    }, interval)
  }

  const handleAddToBucketList = async (place: google.maps.places.PlaceResult) => {
    if (!place.place_id) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Invalid place data',
      })
      return;
    }

    try {
      await addToBucketList({
        place_id: place.place_id,
        name: place.name || '',
        address: place.formatted_address || '',
        latitude: place.geometry?.location?.lat() || 0,
        longitude: place.geometry?.location?.lng() || 0,
      });
      Toast.show({
        type: 'success',
        text1: 'Added to bucket list',
      });
    } catch (error) {
      console.error('Error adding to bucket list:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Could not add to bucket list',
      });
    }
  };

  const handleFilterClick = () => {
    toggleShowPanel()
    setShowZipcodePanel(false);
    setShowFavPanel(false);
    setShowBucketListPanel(false);
  };

  const handleFavoritesClick = () => {
    setShowFavPanel(!showFavPanel)
    setShowBucketListPanel(false)
    setShowPanel(false)
    setShowZipcodePanel(false)
  }

  const handleBucketListClick = () => {
    setShowBucketListPanel(!showBucketListPanel)
    setShowFavPanel(false)
    setShowPanel(false)
    setShowZipcodePanel(false)
  }

  if (isAppLoading) {
    return <LoadingPage />
  }

  const nonAlphaVersionLoaded = Boolean(globalThis && globalThis.google?.maps?.version && !globalThis.google?.maps?.version.endsWith('-alpha'))

  if (nonAlphaVersionLoaded) {
    location.reload()
    return
  }

  return (
    <View style={styles.container}>
      <HeaderButton isLoggedIn />
      <APIProvider apiKey={API_KEY} version={'alpha'}>

        <Earth />
        <SearchBox />
        {showPanel && <SidePanel />}
        {showZipcodePanel && <ZipPanel />}
        {showBucketListPanel && <BucketListPanel />}
        {showFavPanel && <FavoritesPanel />}

        {
          !isModalOpen && (
            <View style={{ ...styles.toggleButtonGroup, left: showPanel || showZipcodePanel || showBucketListPanel || showFavPanel ? 420 : 20 }}>
              <Pressable style={{ ...styles.toggleButton, backgroundColor: showPanel ? '#49A84C' : 'white' }} onPress={handleFilterClick}>
                <IconFilter size={20} strokeWidth={2} color={showPanel ? 'white' : 'black'} />
              </Pressable>

              <Pressable style={{ ...styles.toggleButton, backgroundColor: showZipcodePanel ? '#49A84C' : 'white' }} onPress={() => {
                setShowPanel(false)
                setShowZipcodePanel(!showZipcodePanel)
                setShowFavPanel(false)
                setShowBucketListPanel(false)
              }}>
                <IconZip size={20} strokeWidth={2} color={showZipcodePanel ? 'white' : 'black'} />
              </Pressable>
              {
                isLoggedIn ? (
                  <>
                    <Pressable
                      style={{ ...styles.toggleButton, backgroundColor: showFavPanel ? '#49A84C' : 'white' }}
                      onPress={handleFavoritesClick}
                    >
                      <IconHeart size={20} strokeWidth={2} color={showFavPanel ? 'white' : 'black'} />
                    </Pressable>
                    <Pressable
                      style={{ ...styles.toggleButton, backgroundColor: showBucketListPanel ? '#49A84C' : 'white' }}
                      onPress={handleBucketListClick}
                    >
                      <IconBookmark size={20} strokeWidth={2} color={showBucketListPanel ? 'white' : 'black'} />
                    </Pressable>
                  </>
                ) : null
              }
            </View>
          )
        }

        {selectedRealEstateProperty && (
          <View style={styles.modal}>
            <IconX
              style={{
                position: 'absolute',
                top: -20,
                left: -20,
                backgroundColor: '#49A84C',
                borderRadius: 4,
                cursor: 'pointer',
                padding: 4,
              }}
              color='white'
              onClick={() => setSelectedRealEstateProperty(null)}
              size={28}
            />

            <View style={{ gap: 6, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <Image
                source={{ uri: selectedRealEstateProperty.img_url }}
                style={{ height: 180, objectFit: 'cover', borderRadius: 6 }}
              />
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                {selectedRealEstateProperty.address_line} [{selectedRealEstateProperty.status.split('_').join(' ').toUpperCase()}]
              </Text>
              <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
                {selectedRealEstateProperty.price}
              </Text>
              {selectedRealEstateProperty.size_sqft && (
                <Text style={{ fontSize: 14 }}>{selectedRealEstateProperty.size_sqft} ft²</Text>
              )}
              <Text style={{ fontSize: 14, display: 'flex', flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                <IconBuildingSkyscraper /> <b>Type:</b> {selectedRealEstateProperty.property_type.split('_').join(' ').toUpperCase()}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Text style={{ fontSize: 14, display: 'flex', flexDirection: 'row', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
                  <IconBed /> {selectedRealEstateProperty.num_beds === 0 ? '?' : selectedRealEstateProperty.num_beds}
                </Text>
                <Text style={{ fontSize: 14, display: 'flex', flexDirection: 'row', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
                  <IconBath /> {selectedRealEstateProperty.num_baths === 0 ? '?' : selectedRealEstateProperty.num_baths}
                </Text>
              </View>

              {showNeighbourhoodInsights && ('population' in selectedRealEstateProperty) && (
                <View style={{ gap: 6, display: 'flex', flexDirection: 'column' }}>
                  <Text style={{ fontSize: 14 }}><b>Population:</b> {selectedRealEstateProperty.population}</Text>
                  <Text style={{ fontSize: 14 }}><b>Median Age:</b> {selectedRealEstateProperty.median_age}</Text>
                  <Text style={{ fontSize: 14 }}><b>Male Population:</b> {selectedRealEstateProperty.male_pop}</Text>
                  <Text style={{ fontSize: 14 }}><b>Male Median Age:</b> {selectedRealEstateProperty.median_age_male}</Text>
                  <Text style={{ fontSize: 14 }}><b>Female Population:</b> {selectedRealEstateProperty.female_pop}</Text>
                  <Text style={{ fontSize: 14 }}><b>Female Median Age:</b> {selectedRealEstateProperty.median_age_female}</Text>
                  <Text style={{ fontSize: 14 }}>
                    <b>Predicted Price (1-Year):</b> {
                      `$${(Number(selectedRealEstateProperty.price.replace("$", "").replaceAll(",", "")) + Number(selectedRealEstateProperty.price.replace("$", "").replaceAll(",", "")) * (selectedRealEstateProperty.home_value_forecast / 10)).toLocaleString("en-US")}`
                    }
                  </Text>
                </View>
              )}

              {!showNeighbourhoodInsights && ('population' in selectedRealEstateProperty) && (
                <Pressable
                  style={{
                    backgroundColor: '#4285F4',
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 6,
                    flexDirection: 'row',
                    gap: 4,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  onPress={() => handleNeighbourhoodInsightsChange(!showNeighbourhoodInsights)}
                >
                  {
                    isLoading ? (
                      <ActivityIndicator color='white' size='small' />
                    ) : (
                      <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
                        <IconSparkles color='white' />
                        <Text style={{ fontSize: 14, color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Neighbourhood Insights</Text>
                      </View>
                    )
                  }
                </Pressable>
              )}

              <Pressable
                style={{
                  backgroundColor: '#49A84C',
                  marginTop: showNeighbourhoodInsights ? 10 : 0,
                  padding: 10,
                  borderRadius: 6,
                  flexDirection: 'row',
                  gap: 4,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={() => Linking.openURL(selectedRealEstateProperty.prop_url)}
              >
                <IconLiveView color='white' />
                <Text style={{ fontSize: 14, color: 'white', textAlign: 'center', fontWeight: 'bold' }}>View Live</Text>
              </Pressable>
            </View>
          </View>
        )
        }
        {isModalOpen && <SuitabilityCalculator />}

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
    left: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    zIndex: 1000
  },
  toggleButton: {
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modal: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    padding: 20,
    borderRadius: 10,
    width: 300,
  },
  tourButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    borderColor: '#05A659',
    borderWidth: 1,
    marginTop: 10,
  },
  tourWrapper: {
    position: 'relative', 
    alignItems: 'center',
  },
  tourPrompt: {
    position: 'absolute',
    top: 0, 
    left: 55, 
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25, 
    zIndex: 10, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5, 
    opacity: 1, 
    width: 220,
    alignItems: 'center', 
    justifyContent: 'center',
  },
  tourPromptText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500', 
    textAlign: 'center', 
    lineHeight: 18,
    letterSpacing: 0.5, 
  },
  icon: {
    fontSize: 20,
    color: 'white',
  },
})
