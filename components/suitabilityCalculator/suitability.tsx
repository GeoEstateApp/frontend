import { View, Text, StyleSheet, Button, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Picker } from '@react-native-picker/picker'
import { Slider } from '@miblanchard/react-native-slider';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { IconSearch, IconX } from '@tabler/icons-react';

interface Prefs {
  minBeds: number,
  minBaths: number,
  rentOrBuy: 'buy' | 'sell',
  priceMin: number,
  priceMax: number,
  age: number,
  homeValuePriority: boolean,
  filterByMedianAge: boolean,
  anchorAddresses: [],
  propsToReturn: number
}

interface RecommendationPlace {
  address: string
  lat: number
  lng: number
}

const MIN_SEARCH_LENGTH = 3

export default function Suitability() {
  const [currentPage, setCurrentPage] = useState(0)

  // Page One
  const [rentOrBuy, setRentOrBuy] = useState("buy")

  // Page Two
  const [noOfBathrooms, setNoOfBathrooms] = useState(0)
  const [noOfBedrooms, setNoOfBedrooms] = useState(0)

  // Page Three
  const MIN_PRICE = 10000
  const MAX_PRICE = 9999999
  const [minPrice, setMinPrice] = useState(MIN_PRICE)
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE)

  // Page Four
  const [wantPropertyRecommendationAge, setWantPropertyRecommendationAge] = useState<boolean | null>(null)
  const [propertyRecommendationAge, setPropertyRecommendationAge] = useState(0)

  // Page Five
  const [wantAnyRecommendedPlaces, setWantAnyRecommendedPlaces] = useState<boolean | null>(null)
  const [recommendedPlaces, setRecommendedPlaces] = useState<RecommendationPlace[]>([])
  const [placeAutocompleteService, setPlaceAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null)
  const [predictions, setPredictions] = useState<Array<google.maps.places.AutocompletePrediction>>([])
  const [searchText, setSearchText] = useState("")
  const places = useMapsLibrary('places')

  useEffect(() => {
    if (!places) return

    setPlaceAutocompleteService(new places.AutocompleteService())
  }, [places]);

  const handleSearchTextChange = (searchText: string) => {
    setSearchText(searchText)

    if (searchText.length < MIN_SEARCH_LENGTH) return

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

      const address = place.formatted_address || ""
      const lat = place.geometry?.location?.lat() || 0.0
      const lng = place.geometry?.location?.lng() || 0.0

      setSearchText(place.name || "")
      setPredictions([])
      setRecommendedPlaces((prev) => [...prev, { address, lat, lng }])
    })
  }

  const prefs: Prefs = {
    minBeds: 0,
    minBaths: 0,
    rentOrBuy: 'buy',
    priceMin: 0,
    priceMax: 0,
    age: 0,
    homeValuePriority: false,
    filterByMedianAge: false,
    anchorAddresses: [],
    propsToReturn: 0
  }
  const nextPage = () => setCurrentPage((prev) => prev + 1)

  const handlePageOne = (answer: string) => {
    setRentOrBuy(answer)
    if (answer === "buy" || answer === "sell") prefs.rentOrBuy = answer

    nextPage()
  }

  const handlePageTwo = () => {
    prefs.minBeds = noOfBedrooms
    prefs.minBaths = noOfBathrooms

    nextPage()
  }

  const handlePageThree = () => {
    prefs.priceMin = minPrice
    prefs.priceMax = maxPrice

    nextPage()
  }

  const handlePageFour = () => {
    prefs.age = propertyRecommendationAge

    nextPage()
  }

  const handlePageFive = () => {
    const anchorAddresses = recommendedPlaces.map((place) => [place.lat, place.lng])
    console.log(anchorAddresses)

    // fetch data

    console.log(prefs)
  }

  return (
    <View style={styles.modal}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8 }}>
        {
          currentPage > 0 && (
            Array.from({ length: 5 }).map((_, idx) => {
              return (
                <View key={idx} style={styles.getStarted}>
                  <Text onPress={() => idx < currentPage && setCurrentPage(idx + 1)} style={{ ...styles.pageNumber, borderColor: currentPage >= idx + 1 ? '#49a84c' : 'grey', color: currentPage >= idx + 1 ? '#49a84c' : 'grey' }}>{idx + 1}</Text>
                </View>
              )
            })
          )
        }
      </View>

      {
        currentPage == 0 && (
          <View style={styles.getStarted}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Welcome to the Suitability Calculator</Text>
            <Button title="Get Started" onPress={() => setCurrentPage(1)} />
          </View>
        )
      }

      {
        currentPage == 1 && (
          <View style={styles.pageOne}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Are you renting or buying?</Text>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 16 }} >
              <Button title="Renting" onPress={() => handlePageOne('rent')} />
              <Button title="Buying" onPress={() => handlePageOne('buy')} />
            </View>
          </View>
        )
      }

      {
        currentPage == 2 && (
          <View style={styles.pageTwo}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>How many bathroom's and bedrooms do you need?</Text>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
              <Text>Bathrooms:</Text>
              <Picker
                style={{ padding: 8 }}
                selectedValue={noOfBathrooms}
                onValueChange={(itemValue) => setNoOfBathrooms(itemValue)}>
                {
                  Array.from({ length: 9 }).map((_, idx) => (
                    <Picker.Item key={idx} label={idx.toString()} value={idx} />
                  ))
                }
              </Picker>

              <Text>Bedrooms:</Text>
              <Picker
                style={{ padding: 8 }}
                selectedValue={noOfBedrooms}
                onValueChange={(itemValue) => setNoOfBedrooms(itemValue)}>
                {
                  Array.from({ length: 9 }).map((_, idx) => (
                    <Picker.Item key={idx} label={idx.toString()} value={idx} />
                  ))
                }
              </Picker>
            </View>
            <Button title="Next" onPress={() => handlePageTwo()} />
          </View>
        )
      }

      {
        currentPage === 3 && (
          <View style={styles.pageThree}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>What is your price range?</Text>
            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text><b>Minimum Price:</b> ${minPrice}</Text>
                <Text><b>Maximum Price:</b> ${maxPrice}</Text>
              </View>
              <Slider
                minimumValue={MIN_PRICE}
                maximumValue={MAX_PRICE}
                value={[minPrice, maxPrice]}
                step={1000}
                trackMarks={[minPrice, maxPrice]}
                minimumTrackTintColor="grey"
                maximumTrackTintColor="#000000"
                onValueChange={value => {
                  setMinPrice(value[0])
                  setMaxPrice(value[1])
                }}
              />
              <Button title="Next" onPress={() => handlePageThree()} />
            </View>
          </View>
        )
      }

      {
        currentPage == 4 && (
          <View style={styles.pageFour}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Do you want property recommendations based on your age?</Text>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 16 }} >
              <Button title="Yes" onPress={() => setWantPropertyRecommendationAge(true)} />
              <Button title="No" onPress={() => setWantPropertyRecommendationAge(false)} />
            </View>
            {
              wantPropertyRecommendationAge && (
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 16 }} >
                  <Text>Age:</Text>
                  <TextInput
                    style={{ height: 40, borderColor: 'gray', borderWidth: 1, padding: 8 }}
                    keyboardType="numeric"
                    value={propertyRecommendationAge.toString()}
                    onChangeText={text => setPropertyRecommendationAge(parseInt(text))}
                  />
                </View>
              )
            }
            <Button title="Next" onPress={() => handlePageFour()} />

          </View>
        )
      }

      {
        currentPage == 5 && (
          <View style={styles.pageFive}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Do you have an address youd live to live near</Text>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 16, flexGrow: 1, maxHeight: 38 }}>
              <Button title="Yes" onPress={() => setWantAnyRecommendedPlaces(true)} />
              <Button title="No" onPress={() => setWantAnyRecommendedPlaces(false)} />
            </View>
            {
              wantAnyRecommendedPlaces && (
                <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between', gap: 16 }} >
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
                  {
                    recommendedPlaces.length > 0 && (
                      <View style={styles.recommendedPlacesContainer}>
                        {recommendedPlaces.map((place, index) => <Text key={index} style={styles.recommendedPlacesItem}>{place.address} <IconX style={{ cursor: 'pointer' }} onClick={() => setRecommendedPlaces((prev) => prev.filter((val) => place.address !== val.address))} /></Text>) }
                      </View>
                    )
                  }
                </View>
              )
            }
            <Button title="Next" onPress={() => handlePageFive()} />
          </View>
        )
      }
    </View>
  )
}

const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    width: '50%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginVertical: 'auto',
    marginHorizontal: 'auto',
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
  pageNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: 'grey',
    borderRadius: 5000,
    padding: 8,
    cursor: 'pointer',
    userSelect: 'none',
    borderWidth: 1,
    borderColor: 'grey'
  },
  getStarted: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    gap: 16
  },
  pageOne: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 16
  },
  pageTwo: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 16
  },
  pageThree: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 16
  },
  pageFour: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 16
  },
  pageFive: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 16
  },
  recommendedPlacesContainer: {
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
  recommendedPlacesItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomColor: '#e4e4e7',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
});