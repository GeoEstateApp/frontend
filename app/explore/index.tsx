import { AICommentsSummary, Earth, SearchBox, SidePanel, SuitabilityCalculator, ZipPanel } from '@/components'
import { APIProvider } from '@vis.gl/react-google-maps'
import { ActivityIndicator, Button, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useEffect, useState } from 'react'
import { TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { IconUser, IconLogin, IconFilter, IconZip, IconSparkles, IconBed, IconBath, IconBuildingSkyscraper, IconAi, IconLiveView, IconGenderMale, IconGenderFemale, IconX, IconHeart, IconBookmark } from '@tabler/icons-react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
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
  const { showZipcodePanel, setShowZipcodePanel } = useZipcodeInsights()

  const [showNeighbourhoodInsights, setNeighbourhoodInsights] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { setShowPanel, showPanel, selectedRealEstateProperty, setSelectedRealEstateProperty } = useSidePanelStore()
  const { isModalOpen } = useSuitability()

  const { showFavPanel, setShowFavPanel } = useFavoritesPanelStore()
  const { showBucketListPanel, setShowBucketListPanel } = useBucketListPanelStore()

  const isLoggedIn = auth.currentUser !== null

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

  return (
    <View style={styles.container}>
      <HeaderButton />
      <APIProvider apiKey={API_KEY} version={GOOGLE_MAP_VERSION}>
        <Earth />
        <SearchBox />
        {showPanel && <SidePanel />}
        {showZipcodePanel && <ZipPanel />}
        {showBucketListPanel && <BucketListPanel />}
        {showFavPanel && <FavoritesPanel />}

        {
          !isModalOpen && (
            <View style={{ ...styles.toggleButtonGroup, left: showPanel || showZipcodePanel || showBucketListPanel || showFavPanel ? 420 : 20 }}>
              <Pressable style={{ ...styles.toggleButton, backgroundColor: showPanel ? '#49A84C' : 'white' }} onPress={() => {
                setShowZipcodePanel(false)
                setShowPanel(!showPanel)
                setShowFavPanel(false)
                setShowBucketListPanel(false)
              }}>
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
                isLoggedIn && (
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
                )
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
        { isModalOpen && <SuitabilityCalculator /> }
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
  }
})