import { View, Text, StyleSheet, Button, TextInput, ScrollView, Pressable, Image, ActivityIndicator, RefreshControl, FlatList, ImageStyle } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Picker } from '@react-native-picker/picker'
import { Slider } from '@miblanchard/react-native-slider';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { IconSearch, IconX, IconHome, IconKey, IconBed, IconBath, IconArrowLeft, IconArrowRight, IconMap, IconRuler } from '@tabler/icons-react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSidePanelStore } from '@/states/sidepanel';

interface Prefs {
  minBeds: number,
  minBaths: number,
  rentOrBuy: 'buy' | 'rent',
  priceMin: number,
  priceMax: number,
  age: number | null,
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

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  onStepClick: (step: number) => void;
}

const MIN_SEARCH_LENGTH = 3

const MIN_PRICE = 10000
const MAX_PRICE = 9999999

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps = 6, onStepClick }) => {
  return (
    <View style={styles.stepContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <Pressable 
          key={`step-${index}`} 
          onPress={() => index < currentStep && onStepClick(index)}
          style={[styles.stepWrapper, index < currentStep && styles.stepClickable]}>
          <View style={[
            styles.stepCircle,
            index < currentStep && styles.stepCompleted,
            index === currentStep && styles.stepCurrent,
          ]}>
            <Text style={[
              styles.stepNumber,
              (index < currentStep || index === currentStep) && styles.stepNumberActive
            ]}>{index + 1}</Text>
          </View>
          {index < totalSteps - 1 && (
            <View style={[
              styles.stepLine,
              index < currentStep && styles.stepLineCompleted
            ]} />
          )}
        </Pressable>
      ))}
    </View>
  );
};

export default function SuitabilityCalculator() {
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [recommendationProperties, setRecommendationProperties] = useState<RecommendationProperties[]>([])

  const { setSelectedRealEstateProperty, selectedRealEstateProperty } = useSidePanelStore()

  // Page One
  const [rentOrBuy, setRentOrBuy] = useState<"rent" | "buy">("buy")

  // Page Two
  const [noOfBathrooms, setNoOfBathrooms] = useState(0)
  const [noOfBedrooms, setNoOfBedrooms] = useState(0)

  // Page Three
  const [minPrice, setMinPrice] = useState(MIN_PRICE)
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE)

  // Page Four
  const [wantPropertyRecommendationAge, setWantPropertyRecommendationAge] = useState<boolean | null>(null)
  const [propertyRecommendationAge, setPropertyRecommendationAge] = useState<number | null>(null)

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

  const handleSearchTextChange = async (searchText: string) => {
    setSearchText(searchText)
    setError(null)

    if (searchText.length < MIN_SEARCH_LENGTH) {
      setPredictions([])
      return
    }

    if (!placeAutocompleteService) {
      setError("Location search service is not available")
      return
    }

    try {
      const predictionsResult = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve, reject) => {
        placeAutocompleteService.getPlacePredictions(
          { input: searchText },
          (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
              resolve(predictions || [])
            } else {
              reject(new Error(`Place search failed: ${status}`))
            }
          }
        )
      })
      
      setPredictions(predictionsResult)
    } catch (error) {
      console.error(error)
      setError("Failed to search locations. Please try again.")
      setPredictions([])
    }
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

  const loadProperties = async (pageNumber: number, refresh = false) => {
    try {
      const { idToken } = await getAuthTokens();
      if (!idToken) {
        throw new Error('Authentication required');
      }

      const prefs: Prefs = {
        rentOrBuy,
        anchorAddresses: wantAnyRecommendedPlaces ? recommendedPlaces.map((place) => [place.lat, place.lng]) : [],
        minBaths: noOfBathrooms,
        minBeds: noOfBedrooms,
        priceMin: minPrice,
        priceMax: maxPrice,
        age: propertyRecommendationAge || 0, 
        propsToReturn: 50,
        homeValuePriority: wantPropertyRecommendationAge || false,
        filterByMedianAge: wantPropertyRecommendationAge || false
      }

      const response = await fetch(`https://photo-gateway-7fw1yavc.ue.gateway.dev/api/recommendations?page=${pageNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(prefs),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to get recommendations: ${response.status}`);
      }

      const data = await response.json()
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format from server');
      }
      
      const properties: RecommendationProperties[] = data.data.map((property: RecommendationProperties) => property)
      
      if (refresh) {
        setRecommendationProperties(properties)
      } else {
        setRecommendationProperties(prev => {
          const existingIds = new Set(prev.map(p => p.property_id))
          const uniqueNewProperties = properties.filter(p => !existingIds.has(p.property_id))
          return [...prev, ...uniqueNewProperties]
        })
      }
      
      setHasMore(properties.length === 10)
      
      if (properties.length === 0 && pageNumber === 1) {
        setError("No properties found matching your criteria. Try adjusting your preferences.");
      }
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Failed to get recommendations. Please try again.");
    }
  }

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    await loadProperties(page + 1);
    setPage(prev => prev + 1);
    setIsLoadingMore(false);
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(1);
    await loadProperties(1, true);
    setIsRefreshing(false);
  }

  const handlePageFive = async () => {
    setIsLoading(true);
    setError(null);
    await loadProperties(1, true);
    setIsLoading(false);
  }

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#49a84c" />
      </View>
    );
  }

  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No properties found</Text>
        <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
      </View>
    );
  }

  const renderProperty = ({ item: property }: { item: RecommendationProperties }) => (
    <Pressable 
      style={[
        styles.recommendedPropertyCard,
        selectedRealEstateProperty?.property_id === property.property_id && styles.recommendedPropertyCardSelected
      ]} 
      onPress={() => setSelectedRealEstateProperty(property)}>
      <View style={styles.propertyImageContainer}>
        <Image 
          source={{ uri: property.img_url }} 
          style={styles.propertyImage as ImageStyle}
          resizeMode="cover"
        />
        <View style={styles.propertyBadge}>
          <Text style={styles.propertyStatus}>
            {property.status === 'for_rent' ? 'FOR RENT' : 'FOR SALE'}
          </Text>
        </View>
        <View style={styles.propertyPriceBadge}>
          <Text style={styles.propertyPriceText}>
            {property.price}
          </Text>
        </View>
      </View>
      <View style={styles.propertyContent}>
        <View style={styles.propertyHeader}>
          <View style={styles.propertyTitleSection}>
            <Text style={styles.propertyType}>
              {property.property_type.split('_').join(' ').toUpperCase()}
            </Text>
            <Text style={styles.propertyAddress}>
              {property.address_line}
            </Text>
          </View>
        </View>

        <View style={styles.propertyFeatureGrid}>
          <View style={styles.featureItem}>
            <IconBed size={20} color="#374151" />
            <Text style={styles.featureText}>
              {property.num_beds} {property.num_beds === 1 ? 'Bed' : 'Beds'}
            </Text>
          </View>
          <View style={styles.featureItem}>
            <IconBath size={20} color="#374151" />
            <Text style={styles.featureText}>
              {property.num_baths} {property.num_baths === 1 ? 'Bath' : 'Baths'}
            </Text>
          </View>
          {property.size_sqft && (
            <View style={styles.featureItem}>
              <IconRuler size={20} color="#374151" />
              <Text style={styles.featureText}>
                {property.size_sqft.toLocaleString()} ft²
              </Text>
            </View>
          )}
        </View>

        <Pressable 
          style={styles.viewOnMapButton}
          onPress={() => {
            setSelectedRealEstateProperty(property);
          }}>
          <IconMap size={18} color="#fff" />
          <Text style={styles.viewOnMapText}>View on Map</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View style={recommendationProperties && recommendationProperties.length > 0 ? styles.sideModal : styles.modal}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {
        recommendationProperties.length === 0 && (
          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <StepIndicator 
                currentStep={currentPage} 
                onStepClick={(step) => setCurrentPage(step)}
              />
            </View>
            <View style={styles.content}>
              {currentPage === 0 && (
                <View style={styles.getStarted}>
                  <Text style={styles.welcomeTitle}>Find Your Perfect Home</Text>
                  <Text style={styles.welcomeSubtitle}>Let's help you discover properties that match your preferences</Text>
                  <Pressable style={styles.primaryButton} onPress={() => setCurrentPage(1)}>
                    <Text style={styles.primaryButtonText}>Get Started</Text>
                  </Pressable>
                </View>
              )}

              {currentPage === 1 && (
                <View style={styles.pageOne}>
                  <Text style={styles.pageTitle}>What's your plan?</Text>
                  <Text style={styles.pageSubtitle}>Are you looking to rent or buy a property?</Text>
                  <View style={styles.choiceContainer}>
                    <Pressable 
                      style={[styles.choiceCard, rentOrBuy === 'rent' && styles.choiceCardActive]} 
                      onPress={() => handlePageOne('rent')}>
                      <View style={styles.choiceIconContainer}>
                        <IconHome size={24} color={rentOrBuy === 'rent' ? '#fff' : '#666'} />
                      </View>
                      <Text style={[styles.choiceTitle, rentOrBuy === 'rent' && styles.choiceTitleActive]}>Renting</Text>
                      <Text style={[styles.choiceDescription, rentOrBuy === 'rent' && styles.choiceDescriptionActive]}>
                        Find properties available for rent
                      </Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.choiceCard, rentOrBuy === 'buy' && styles.choiceCardActive]} 
                      onPress={() => handlePageOne('buy')}>
                      <View style={styles.choiceIconContainer}>
                        <IconKey size={24} color={rentOrBuy === 'buy' ? '#fff' : '#666'} />
                      </View>
                      <Text style={[styles.choiceTitle, rentOrBuy === 'buy' && styles.choiceTitleActive]}>Buying</Text>
                      <Text style={[styles.choiceDescription, rentOrBuy === 'buy' && styles.choiceDescriptionActive]}>
                        Explore properties for sale
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {currentPage === 2 && (
                <View style={styles.pageTwo}>
                  <Text style={styles.pageTitle}>Property Details</Text>
                  <Text style={styles.pageSubtitle}>How many bedrooms and bathrooms do you need?</Text>
                  <View style={styles.preferencesContainer}>
                    <View style={styles.preferenceCard}>
                      <View style={styles.preferenceHeader}>
                        <IconBed size={20} color="#666" />
                        <Text style={styles.preferenceLabel}>Bedrooms</Text>
                      </View>
                      <Picker
                        style={styles.modernPicker}
                        selectedValue={noOfBedrooms}
                        onValueChange={(itemValue) => setNoOfBedrooms(itemValue)}>
                        {Array.from({ length: 9 }).map((_, idx) => (
                          <Picker.Item 
                            key={`bed-${idx}`}
                            label={idx === 0 ? 'Studio' : `${idx} ${idx === 1 ? 'Bedroom' : 'Bedrooms'}`} 
                            value={idx} 
                          />
                        ))}
                      </Picker>
                    </View>
                    <View style={styles.preferenceCard}>
                      <View style={styles.preferenceHeader}>
                        <IconBath size={20} color="#666" />
                        <Text style={styles.preferenceLabel}>Bathrooms</Text>
                      </View>
                      <Picker
                        style={styles.modernPicker}
                        selectedValue={noOfBathrooms}
                        onValueChange={(itemValue) => setNoOfBathrooms(itemValue)}>
                        {Array.from({ length: 9 }).map((_, idx) => (
                          <Picker.Item 
                            key={`bath-${idx}`}
                            label={`${idx} ${idx === 1 ? 'Bathroom' : 'Bathrooms'}`} 
                            value={idx} 
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
              )}

              {currentPage === 3 && (
                <View style={styles.pageThree}>
                  <Text style={styles.pageTitle}>Budget Range</Text>
                  <Text style={styles.pageSubtitle}>What's your ideal price range?</Text>
                  <View style={styles.priceContainer}>
                    <View style={styles.priceCards}>
                      <View style={styles.priceCard}>
                        <Text style={styles.priceLabel}>Minimum Price</Text>
                        <Text style={styles.priceValue}>${minPrice.toLocaleString()}</Text>
                      </View>
                      <View style={styles.priceCard}>
                        <Text style={styles.priceLabel}>Maximum Price</Text>
                        <Text style={styles.priceValue}>${maxPrice.toLocaleString()}</Text>
                      </View>
                    </View>
                    <Slider
                      minimumValue={MIN_PRICE}
                      maximumValue={MAX_PRICE}
                      value={[minPrice, maxPrice]}
                      step={5000}
                      trackMarks={[MIN_PRICE, MAX_PRICE / 2, MAX_PRICE]}
                      minimumTrackTintColor="#49a84c"
                      maximumTrackTintColor="#e4e4e7"
                      thumbTintColor="#49a84c"
                      thumbStyle={{ width: 24, height: 24 }}
                      trackStyle={{ height: 6 }}
                      onValueChange={value => {
                        if (Array.isArray(value)) {
                          setMinPrice(Math.min(value[0], value[1]))
                          setMaxPrice(Math.max(value[0], value[1]))
                        }
                      }}
                    />
                    <View style={styles.priceRangeInfo}>
                      <Text style={styles.priceRangeText}>
                        Price Range: ${MIN_PRICE.toLocaleString()} - ${MAX_PRICE.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {currentPage === 4 && (
                <View style={styles.pageFour}>
                  <Text style={styles.pageTitle}>Your Age</Text>
                  <Text style={styles.pageSubtitle}>Would you like us to find neighborhoods with people in your age group?</Text>
                  <View style={styles.choiceContainer}>
                    <Pressable 
                      style={[styles.choiceCard, wantPropertyRecommendationAge === true && styles.choiceCardActive]} 
                      onPress={() => {
                        setWantPropertyRecommendationAge(true)
                      }}>
                      <View style={styles.choiceIconContainer}>
                        <IconHome size={24} color={wantPropertyRecommendationAge === true ? '#fff' : '#666'} />
                      </View>
                      <Text style={[styles.choiceTitle, wantPropertyRecommendationAge === true && styles.choiceTitleActive]}>
                        Yes, I'll input my age
                      </Text>
                      <Text style={[styles.choiceDescription, wantPropertyRecommendationAge === true && styles.choiceDescriptionActive]}>
                        Find neighborhoods with similar age groups
                      </Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.choiceCard, wantPropertyRecommendationAge === false && styles.choiceCardActive]} 
                      onPress={() => {
                        setWantPropertyRecommendationAge(false)
                        setPropertyRecommendationAge(null)
                      }}>
                      <View style={styles.choiceIconContainer}>
                        <IconHome size={24} color={wantPropertyRecommendationAge === false ? '#fff' : '#666'} />
                      </View>
                      <Text style={[styles.choiceTitle, wantPropertyRecommendationAge === false && styles.choiceTitleActive]}>
                        No preference
                      </Text>
                      <Text style={[styles.choiceDescription, wantPropertyRecommendationAge === false && styles.choiceDescriptionActive]}>
                        Show me all neighborhoods
                      </Text>
                    </Pressable>
                  </View>
                  
                  {wantPropertyRecommendationAge && (
                    <View style={styles.ageInputContainer}>
                      <Text style={styles.ageInputLabel}>Your Age</Text>
                      <Picker
                        style={styles.modernPicker}
                        selectedValue={propertyRecommendationAge}
                        onValueChange={(value) => setPropertyRecommendationAge(value)}>
                        <Picker.Item label="Select your age" value={null} />
                        {Array.from({ length: 83 }, (_, i) => i + 18).map((age) => (
                          <Picker.Item 
                            key={`age-${age}`}
                            label={`${age} years`}
                            value={age}
                          />
                        ))}
                      </Picker>
                    </View>
                  )}
                </View>
              )}

              {currentPage === 5 && (
                <View style={styles.pageFive}>
                  <Text style={styles.pageTitle}>Location Preferences</Text>
                  <Text style={styles.pageSubtitle}>Where would you like to live? (Optional)</Text>
                  
                  <View style={styles.searchSection}>
                    <View style={styles.searchBoxContainer}>
                      <IconSearch size={20} color="#6B7280" />
                      <TextInput
                        style={styles.input}
                        placeholder="Search for a location..."
                        value={searchText}
                        onChangeText={handleSearchTextChange}
                      />
                      {searchText && (
                        <Pressable onPress={() => setSearchText('')}>
                          <IconX size={20} color="#6B7280" />
                        </Pressable>
                      )}
                    </View>
                    
                    {predictions.length > 0 && (
                      <View style={styles.predictionsContainer}>
                        {predictions.map((prediction, index) => (
                          <Pressable
                            key={`prediction-${index}`}
                            style={styles.predictionsItem}
                            onPress={() => handleSelectPlace(prediction.place_id || "")}>
                            <Text style={styles.predictionText}>{prediction.description}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>

                  {recommendedPlaces.length > 0 && (
                    <View style={styles.recommendedPlacesContainer}>
                      {recommendedPlaces.map((place, index) => (
                        <Text key={`place-${place.address}-${index}`} style={styles.recommendedPlacesItem}>
                          {place.address}
                          <IconX
                            size={16}
                            color="#6B7280"
                            style={{ marginLeft: 8, cursor: 'pointer' }}
                            onClick={() => setRecommendedPlaces((prev) => 
                              prev.filter((_, i) => i !== index)
                            )}
                          />
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {currentPage === 6 && !isLoading && recommendationProperties.length === 0 && (
                <View style={styles.pageSix}>
                  <Text style={styles.pageTitle}>Find Properties</Text>
                  <Text style={styles.pageSubtitle}>Click the button below to find properties matching your preferences</Text>
                  <Pressable 
                    style={styles.primaryButton}
                    onPress={handlePageFive}>
                    <Text style={styles.primaryButtonText}>Find Properties</Text>
                  </Pressable>
                </View>
              )}

              {currentPage === 6 && isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#49a84c" />
                  <Text style={styles.loadingText}>Finding your perfect matches...</Text>
                </View>
              )}
            </View>

            <View style={styles.navigationControls}>
              {currentPage > 0 && currentPage < 6 && (
                <Pressable 
                  style={styles.secondaryButton} 
                  onPress={() => setCurrentPage(prev => prev - 1)}>
                  <IconArrowLeft size={20} color="#49a84c" />
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
              )}
              
              {currentPage > 0 && currentPage < 5 && (
                <Pressable 
                  style={[styles.primaryButton, styles.navigationButton]} 
                  onPress={() => nextPage()}>
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <IconArrowRight size={20} color="#ffffff" />
                </Pressable>
              )}

              {currentPage === 5 && (
                <Pressable 
                  style={[styles.primaryButton, styles.navigationButton]} 
                  onPress={() => nextPage()}>
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <IconArrowRight size={20} color="#ffffff" />
                </Pressable>
              )}
            </View>
          </View>
        )
      }

      {recommendationProperties.length > 0 && (
        <View style={styles.listContainer}>
          <FlatList
            data={recommendationProperties}
            renderItem={renderProperty}
            keyExtractor={(item) => `property-${item.property_id}`}
            contentContainerStyle={styles.recommendationsContainer}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={true}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={['#49a84c']}
              />
            }
          />
        </View>
      )}
    </View>
  );
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

const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    width: '60%',
    maxWidth: 800,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  sideModal: {
    position: 'absolute',
    top: 110,
    left: 24,
    width: '35%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    maxHeight: '80%',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 24,
  },
  choiceContainer: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
  choiceCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  choiceCardActive: {
    backgroundColor: '#49a84c',
    borderColor: '#49a84c',
    transform: [{ scale: 1.02 }],
  },
  choiceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  choiceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  choiceTitleActive: {
    color: '#ffffff',
  },
  choiceDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  choiceDescriptionActive: {
    color: '#ffffff',
  },
  preferencesContainer: {
    gap: 24,
    marginBottom: 32,
  },
  preferenceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modernPicker: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
  },
  primaryButton: {
    backgroundColor: '#49a84c',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#49a84c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  priceContainer: {
    gap: 32,
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  priceCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  priceCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  searchBoxContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  predictionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  predictionsItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  predictionText: {
    fontSize: 14,
    color: '#374151',
  },
  recommendedPlacesContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
  },
  recommendedPlacesItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  recommendedPropertyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recommendedPropertyCardSelected: {
    borderColor: '#49a84c',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  propertyImageContainer: {
    position: 'relative',
    height: 200,
    width: '100%',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  propertyBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  propertyPriceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#49a84c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  propertyStatus: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  propertyPriceText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  propertyContent: {
    padding: 16,
  },
  propertyHeader: {
    marginBottom: 16,
  },
  propertyTitleSection: {
    gap: 4,
  },
  propertyType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#49a84c',
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 24,
  },
  propertyFeatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  viewOnMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#49a84c',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  viewOnMapText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  stepContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  stepCompleted: {
    backgroundColor: '#49a84c',
    borderColor: '#49a84c',
  },
  stepCurrent: {
    borderColor: '#49a84c',
    backgroundColor: 'white',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepNumberActive: {
    color: '#49a84c',
  },
  stepLine: {
    width: 80,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  stepLineCompleted: {
    backgroundColor: '#49a84c',
  },
  searchSection: {
    marginBottom: 24,
  },
  selectedLocationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#49a84c',
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  selectedLocationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  selectedLocationAddress: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  recommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  recommendedPlaceCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  recommendedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  recommendedPlaceName: {
    fontSize: 14,
    color: '#6B7280',
  },
  primaryButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
  },
  primaryButtonTextDisabled: {
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  recommendationsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  stepClickable: {
    cursor: 'pointer',
  },
  content: {
    flex: 1,
    marginBottom: 24,
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#49a84c',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  getStarted: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  pageOne: {
    flex: 1,
    padding: 24,
  },
  pageTwo: {
    flex: 1,
    padding: 24,
  },
  pageThree: {
    flex: 1,
    padding: 24,
  },
  pageFour: {
    flex: 1,
    padding: 24,
  },
  pageFive: {
    flex: 1,
    padding: 24,
  },
  pageSix: {
    flex: 1,
    padding: 24,
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContainer: {
    flex: 1,
    height: '100%',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 16,
  },
  priceRangeInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  priceRangeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  ageInputContainer: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ageInputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
});