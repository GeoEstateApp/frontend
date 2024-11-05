import { View, StyleSheet, TextInput, Text, Platform } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { IconSearch } from '@tabler/icons-react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { useMapStore } from '@/states/map'

const MIN_SEARCH_LENGTH = 3

export default function SearchBox() {
  const [placeAutocompleteService, setPlaceAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null)
  const [predictions, setPredictions] = useState<Array<google.maps.places.AutocompletePrediction>>([])
  const [searchText, setSearchText] = useState("")

  const places = useMapsLibrary('places')

  const searchTextRef = useRef<TextInput>(null)

  const { setSelectedPlace } = useMapStore()

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

    const placesService = new places.PlacesService(document.createElement('div'))
    placesService.getDetails({ placeId }, (place, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK) return
      if (!place) return

      setSearchText(place.name || "")
      setSelectedPlace(place)
      setPredictions([])
    })
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.searchBoxContainer}>
        <IconSearch size={16} stroke="#e4e4e7" />
        <TextInput
          ref={searchTextRef}
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
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 32,
    display: 'flex',
    flexDirection: 'column',
    width: '30%',
    zIndex: 999,
  },
  searchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: '#f4f4f5',
    borderRadius: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  input: {
    flex: 1,
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
})
