import { View, Text, StyleSheet, Button, TextInput, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Picker } from '@react-native-picker/picker'
import { Slider } from '@miblanchard/react-native-slider';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { IconSearch, IconX } from '@tabler/icons-react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSidePanelStore } from '@/states/sidepanel';

interface Prefs {
  minBeds: number,
  minBaths: number,
  rentOrBuy: 'buy' | 'rent',
  priceMin: number,
  priceMax: number,
  age: number,
  homeValuePriority: boolean,
  filterByMedianAge: boolean,
  anchorAddresses: number[][],
  propsToReturn: number
}

export interface RecommendationProperties {
  property_id: number,
  address_line: string,
  coordinate_lat: number,
  coordinate_lon: number,
  size_sqft: number,
  property_type: string,
  price: string,
  status: string,
  zip_code_id: number,
  num_beds: number,
  num_baths: number,
  prop_url: string,
  img_url: string,
  geom: string
}

interface RecommendationPlace {
  address: string
  lat: number
  lng: number
}

const MIN_SEARCH_LENGTH = 3

export default function SuitabilityCalculator() {
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const [recommendationProperties, setRecommendationProperties] = useState<RecommendationProperties[]>([])

  const { setSelectedRealEstateProperty, selectedRealEstateProperty } = useSidePanelStore()

  // Page One
  const [rentOrBuy, setRentOrBuy] = useState<"rent" | "buy">("buy")

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
  const [wantPropertyRecommendationMedianAge, setWantPropertyRecommendationMedianAge] = useState<boolean | null>(null)
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
  const nextPage = () => setCurrentPage((prev) => prev + 1)

  const handlePageOne = (answer: string) => {
    if (answer === "rent" || answer === "buy") setRentOrBuy(answer)

    nextPage()
  }

  const handlePageFive = async () => {
    setIsLoading(true)

    const anchorAddresses = recommendedPlaces.map((place) => [place.lat, place.lng])
    console.log(anchorAddresses)

    // fetch data
    const prefs: Prefs = {
      rentOrBuy: rentOrBuy,
      anchorAddresses: wantAnyRecommendedPlaces ? anchorAddresses : [],
      minBaths: noOfBathrooms,
      minBeds: noOfBedrooms,
      priceMin: minPrice,
      priceMax: maxPrice,
      age: propertyRecommendationAge,
      propsToReturn: 5,
      homeValuePriority: wantPropertyRecommendationAge || false,
      filterByMedianAge: wantPropertyRecommendationMedianAge || false
    }

    const { idToken, uid, userName } = await getAuthTokens();
    if (!idToken || !uid) {
      throw new Error("Authentication tokens are missing.");
    }

    try {
      const response = await fetch(`https://photo-gateway-7fw1yavc.ue.gateway.dev/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(prefs),
      })

      if (!response.ok) {
        console.log(response)
        return
      }

      const data = await response.json()
      const properties: RecommendationProperties[] = data.data.map((property: RecommendationProperties) => property)
      setRecommendationProperties(properties)
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAuthTokens = async () => {
    try {
      const idToken = await AsyncStorage.getItem("idToken");
      const uid = await AsyncStorage.getItem("uid");
      const userName = await AsyncStorage.getItem("username");

      return { idToken, uid, userName };
    } catch (error) {
      console.error("Error retrieving auth tokens:", error);
      throw error;
    }
  };

  return (
    <View style={recommendationProperties && recommendationProperties.length > 0 ? styles.sideModal : styles.modal}>
      {
        recommendationProperties && recommendationProperties.length <= 0 && (
          <View style={{ flex: 1 }}>
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
                  <Button title="Next" onPress={() => nextPage()} />
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
                    <Button title="Next" onPress={() => nextPage()} />
                  </View>
                </View>
              )
            }

            {
              currentPage == 4 && (
                <View style={styles.pageFour}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Do you want property recommendations based on your age?</Text>
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 16 }} >
                    <Button title="Yes" onPress={() => setWantPropertyRecommendationAge(true)} color={wantPropertyRecommendationAge ? 'green' : 'blue'} />
                    <Button title="No" onPress={() => setWantPropertyRecommendationAge(false)} color={wantPropertyRecommendationAge ? 'blue' : 'green'} />
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
                  <Button title="Next" onPress={() => nextPage()} />
                </View>
              )
            }

            {
              currentPage == 5 && (
                <View style={styles.pageFive}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Do you have an address you'd live to live near?</Text>
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 16, flexGrow: 1, maxHeight: 38 }}>
                    <Button title="Yes" onPress={() => setWantAnyRecommendedPlaces(true)} color={wantAnyRecommendedPlaces ? 'green' : 'blue'} />
                    <Button title="No" onPress={() => setWantAnyRecommendedPlaces(false)} color={wantAnyRecommendedPlaces ? 'blue' : 'green'} />
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
                              {recommendedPlaces.map((place, index) => <Text key={index} style={styles.recommendedPlacesItem}>{place.address} <IconX style={{ cursor: 'pointer' }} onClick={() => setRecommendedPlaces((prev) => prev.filter((val) => place.address !== val.address))} /></Text>)}
                            </View>
                          )
                        }
                      </View>
                    )
                  }
                  <Pressable onPress={() => handlePageFive()} style={{ backgroundColor: '#80808080', padding: 8, borderRadius: 6 }}>
                    {
                      isLoading ? <ActivityIndicator size="small" /> : "Finish"
                    }
                  </Pressable>
                </View>
              )
            }
          </View>
        )
      }

      {
        recommendationProperties && recommendationProperties.length > 0 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {
              recommendationProperties.map((recommendationProperty, idx) => {
                return (
                  <Pressable key={idx} style={{...styles.recommendedPropertiesCard, backgroundColor: selectedRealEstateProperty?.property_id === recommendationProperty.property_id ? '#49A84C' : 'white'}} onPress={() => setSelectedRealEstateProperty(recommendationProperty)}>
                    <View style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
                      <Image source={{ uri: recommendationProperty.img_url }} style={{ width: 100, objectFit: 'cover', borderRadius: 6 }} />
                      <View style={{ gap: 4, display: 'flex', flexDirection: 'column' }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: selectedRealEstateProperty?.property_id === recommendationProperty.property_id ? 'white' : 'black' }}>{recommendationProperty.address_line}</Text>
                        <Text style={{ fontSize: 14, color: selectedRealEstateProperty?.property_id === recommendationProperty.property_id ? 'white' : 'black' }}>Property: {recommendationProperty.property_type.split('_').join(' ').toUpperCase()}</Text>
                        {recommendationProperty.size_sqft && <Text style={{ fontSize: 14, color: selectedRealEstateProperty?.property_id === recommendationProperty.property_id ? 'white' : 'black' }}>Size: {recommendationProperty.size_sqft} ft²</Text>}
                        <Text style={{ fontSize: 14, color: selectedRealEstateProperty?.property_id === recommendationProperty.property_id ? 'white' : 'black' }}>{recommendationProperty.price}</Text>
                        <Text style={{ fontSize: 12, color: selectedRealEstateProperty?.property_id === recommendationProperty.property_id ? 'white' : 'black' }}>{recommendationProperty.status}</Text>
                      </View>
                    </View>
                  </Pressable>
                )
              })
            }
          </ScrollView>

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
  sideModal: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    top: 110,
    left: 10,
    height: '50%',
    width: '30%',
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
  },
  recommendedPropertiesCard: {
    gap: 8,
    flexDirection: 'column',
    backgroundColor: '#fefefe',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  }
});