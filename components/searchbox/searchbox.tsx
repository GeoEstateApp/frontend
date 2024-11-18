import { View, StyleSheet, TextInput, Text, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { IconSearch, IconSum } from '@tabler/icons-react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { useMapStore } from '@/states/map'
import { useSidePanelStore } from '@/states/sidepanel'
import { getAuth } from 'firebase/auth'
import { useSuitability } from '@/states/suitability'
import Toast from 'react-native-toast-message'

const MIN_SEARCH_LENGTH = 3

export default function SearchBox() {
  const [placeAutocompleteService, setPlaceAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null)
  const [predictions, setPredictions] = useState<Array<google.maps.places.AutocompletePrediction>>([])
  const [searchText, setSearchText] = useState("")
  const { toggleModal } = useSuitability()

  const places = useMapsLibrary('places')

  const { setSelectedPlace } = useMapStore()
  const { setShowPanel, setSelectedPlace: setSidePanelSelectedPlace } = useSidePanelStore()

  useEffect(() => {
    if (!places) return

    setPlaceAutocompleteService(new places.AutocompleteService())
  }, [places]);

  const handleSearchTextChange = (searchText: string) => {
    setSearchText(searchText)

    if (searchText.length < MIN_SEARCH_LENGTH) return

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

      setSidePanelSelectedPlace({ 
        placeId: place.place_id,
        name: place.name,
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
      <IconSum style={styles.calculatorButton} size={22} stroke="#e4e4e7" onClick={() => {
        if (getAuth().currentUser) toggleModal()
        else {
          Toast.show({
            type: 'info',
            text1: 'Please login to use this feature.',
            visibilityTime: 3000,
            text1Style: { fontSize: 14 },
            autoHide: true
          }) 
        }
      }} />
      <View style={{ flexDirection: 'column' }}>
        <View style={styles.searchBoxContainer}>
          <IconSearch size={16} stroke="#e4e4e7" />
          <TextInput
            style={styles.input}
            value={searchText}
            placeholder="Search for any place"
            onChangeText={(searchText) => handleSearchTextChange(searchText)}
            placeholderTextColor="#666" />
        </View>

        {
          predictions.length > 0 && (
            <View style={styles.predictionsContainer}>
              {predictions.map((prediction, index) => (
                <Text
                  key={index}
                  style={styles.predictionsItem}
                  onPress={() => handleSelectPlace(prediction.place_id || "")}>
                  {prediction.description}
                </Text>
              ))}
            </View>
          )
        }
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 10 : 30,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    maxWidth: 400,
    minWidth: 400,
    zIndex: 999,
  },
  searchBoxContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: '#f4f4f5',
    borderRadius: 8,
    marginHorizontal: 16,
    borderColor: '#e4e4e7',
  },
  input: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 16,
    color: '#27272a',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  predictionsContainer: {
    marginTop: 8,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  predictionsItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  predictionsText: {
    fontSize: 16,
    color: '#27272a',
  },
  calculatorButton: {
    flexShrink: 0,
    zIndex: 1000,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    cursor: 'pointer'
  },
})
