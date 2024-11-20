import { View, StyleSheet, TextInput, Text, Platform, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { IconSearch, IconSum } from '@tabler/icons-react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { useMapStore } from '@/states/map'
import { useSidePanelStore } from '@/states/sidepanel'
import { getAuth } from 'firebase/auth'
import { useSuitability } from '@/states/suitability'
import Toast from 'react-native-toast-message'
import { useBucketListPanelStore } from '@/states/bucketlistpanel'
import { useFavoritesPanelStore } from '@/states/favoritespanel'
import { useZipcodeInsights } from '@/states/zipcode_insights'

const MIN_SEARCH_LENGTH = 3

export default function SearchBox() {
  const [placeAutocompleteService, setPlaceAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null)
  const [predictions, setPredictions] = useState<Array<google.maps.places.AutocompletePrediction>>([])
  const [searchText, setSearchText] = useState("")
  const { isModalOpen, setIsModalOpen } = useSuitability()

  const places = useMapsLibrary('places')

  const { setSelectedPlace } = useMapStore()
  const { showPanel, setShowPanel, setSidePanelPlace, setSelectedRealEstateProperty } = useSidePanelStore()
  const { showBucketListPanel, setShowBucketListPanel } = useBucketListPanelStore()
  const { showFavPanel ,setShowFavPanel } = useFavoritesPanelStore()
  const { showZipcodePanel, setShowZipcodePanel } = useZipcodeInsights()
  const [showSuitablitiyCalculatorIcon, setShowSuitablitiyCalculatorIcon] = useState(true)

  useEffect(() => {
    if (!places) return

    setPlaceAutocompleteService(new places.AutocompleteService())
  }, [places]);

  useEffect(() => {
    if (showPanel || showBucketListPanel || showFavPanel || showZipcodePanel) {
      setShowSuitablitiyCalculatorIcon(false)
    } else {
      setShowSuitablitiyCalculatorIcon(true)
    }
  }, [showPanel, showBucketListPanel, showFavPanel, showZipcodePanel])

  const handleSearchTextChange = (searchText: string) => {
    setSearchText(searchText)

    if (searchText.length < MIN_SEARCH_LENGTH) {
      setPredictions([])
      return
    }

    setSelectedPlace(null)
    setPredictions([])

    if (!placeAutocompleteService) return

    placeAutocompleteService.getPlacePredictions({ input: searchText }, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) setPredictions(predictions || [])
    })
  }

  const handleSelectPlace = (placeId: string) => {
    if (placeId === "" || placeId === undefined || !places) return

    setSidePanelPlace(null)
    setShowFavPanel(false)
    setShowBucketListPanel(false)
    setSelectedRealEstateProperty(null)

    const placesService = new places.PlacesService(document.createElement('div'))
    placesService.getDetails({ placeId }, (place, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK) return
      if (!place) return

      const address = place.formatted_address || ""
      const lat = place.geometry?.location?.lat() || 0.0
      const lng = place.geometry?.location?.lng() || 0.0
      const photosUrl = Array.isArray(place.photos) ? place.photos?.map(photo => photo.getUrl({ maxWidth: 300, maxHeight: 300 })) : []
      const rating = place.rating || 0.0
      const types = place.types || []
      const url = place.url || ""

      setSearchText(place.name || "")
      setSelectedPlace(place)
      setPredictions([])

      setSidePanelPlace({ 
        placeId: place.place_id || '',
        name: place.name || '',
        address, 
        photosUrl, 
        rating, 
        types, 
        lat, 
        lng 
      })
      setShowPanel(true)
    })
  }
  
  return (
    <View style={styles.container}>
      {
        showSuitablitiyCalculatorIcon && (
          <Pressable 
            style={styles.calculatorButton} 
            onPress={() => {
              if (getAuth().currentUser) {
                setIsModalOpen(!isModalOpen)
                setShowPanel(false)
                setShowBucketListPanel(false)
                setShowFavPanel(false)
                setShowZipcodePanel(false)
              } else {
                Toast.show({
                  type: 'info',
                  text1: 'Please login to use this feature.',
                  visibilityTime: 3000,
                  text1Style: { fontSize: 14 },
                  autoHide: true
                }) 
              }
            }}
          >
            <IconSum size={20} strokeWidth={2} stroke="#374151" />
          </Pressable>
        )
      }
      
      <View style={styles.searchWrapper}>
        <View style={styles.searchBoxContainer}>
          <IconSearch size={16} stroke="#6B7280" />
          <TextInput
            style={styles.input}
            value={searchText}
            placeholder="Search for any place..."
            onChangeText={handleSearchTextChange}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {predictions.length > 0 && (
          <View style={styles.predictionsContainer}>
            {predictions.map((prediction, index) => (
              <View
                key={index}
                style={[
                  styles.predictionsItem,
                  index === predictions.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={styles.predictionsText}
                  onPress={() => handleSelectPlace(prediction.place_id || "")}
                >
                  {prediction.description}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 40,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '35%',
    maxWidth: 600,
    zIndex: 999,
    paddingHorizontal: 16,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'column',
    marginLeft: 12,
  },
  searchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    ...(Platform.OS === 'web' && {
      outlineWidth: 0
    })
  },
  predictionsContainer: {
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    ...(Platform.OS === 'web' && {
      transform: [{ translateY: 4 }],
      opacity: 1,
    }),
  },
  predictionsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  predictionsText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      ':hover': {
        backgroundColor: '#F9FAFB',
      },
    }),
  },
  calculatorButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginLeft: 30,
    elevation: 3,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      ':hover': {
        backgroundColor: '#F9FAFB',
      },
    }),
  },
})
