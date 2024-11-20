import { View, Text, StyleSheet, Button, TextInput, ScrollView, Pressable, Image, ActivityIndicator, RefreshControl, FlatList, ImageStyle, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Picker } from '@react-native-picker/picker'
import { Slider } from '@miblanchard/react-native-slider';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { IconX, IconSearch, IconArrowLeft, IconArrowRight, IconBed, IconBath, IconRuler, IconMap, IconHome, IconKey } from '@tabler/icons-react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSidePanelStore } from '@/states/sidepanel';
import { useMapStore } from '@/states/map';
import { useSuitability } from '@/states/suitability';

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
    <View style={styles.stepContainer }>
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
  const { setSelectedPlace, setSelectedPlacePolygonCoordinates } = useMapStore()
  const { isModalOpen, setIsModalOpen } = useSuitability()

  useEffect(() => {
    if (!isModalOpen) {
      setSelectedRealEstateProperty(null);
      setSelectedPlace(null);
      setSelectedPlacePolygonCoordinates([]);
    }
  }, [isModalOpen]);

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handlePropertySelect = (property: RecommendationProperties) => {
    setSelectedRealEstateProperty(property);
  };

  const handleViewOnMap = (property: RecommendationProperties) => {
    const place = {
      geometry: {
        location: new google.maps.LatLng(property.coordinate_lat, property.coordinate_lon)
      },
      formatted_address: property.address_line,
      name: property.address_line,
      place_id: property.property_id.toString()
    } as google.maps.places.PlaceResult;

    setSelectedPlace(place);
    setSelectedPlacePolygonCoordinates([]);
  };

  // Page One
  const [rentOrBuy, setRentOrBuy] = useState<"rent" | "buy" | null>(null)

  // Page Two
  const [noOfBathrooms, setNoOfBathrooms] = useState(0)
  const [noOfBedrooms, setNoOfBedrooms] = useState(0)

  // Page Three
  const [minPrice, setMinPrice] = useState(MIN_PRICE)
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE)

  // Page Four
  const [wantPropertyRecommendationAge, setWantPropertyRecommendationAge] = useState<boolean | null>(null)
  const [propertyRecommendationAge, setPropertyRecommendationAge] = useState<number | string>('')

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

  const handlePageOne = (answer: "rent" | "buy") => {
    setRentOrBuy(answer);
  };

  const loadProperties = async (pageNumber: number, refresh = false) => {
    try {
      const { idToken } = await getAuthTokens();
      if (!idToken) {
        throw new Error('Authentication required');
      }

      if (!rentOrBuy) {
        throw new Error('Rent or Buy preference must be selected');
      }
      const prefs: Prefs = {
        rentOrBuy: rentOrBuy,
        anchorAddresses: wantAnyRecommendedPlaces ? recommendedPlaces.map((place) => [place.lat, place.lng]) : [],
        minBaths: noOfBathrooms,
        minBeds: noOfBedrooms,
        priceMin: minPrice,
        priceMax: maxPrice,
        age: typeof propertyRecommendationAge === 'number' ? propertyRecommendationAge : null,
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
      id={`property-${property.property_id}`}
      style={[
        styles.recommendedPropertyCard,
        selectedRealEstateProperty?.property_id === property.property_id && styles.recommendedPropertyCardSelected
      ]} 
      onPress={() => handlePropertySelect(property)}>
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
            <Text style={styles.featureText}>{property.num_beds || '-'} Beds</Text>
          </View>
          {property.num_baths && (
            <View style={styles.featureItem}>
              <IconBath size={20} color="#374151" />
              <Text style={styles.featureText}>{property.num_baths} Baths</Text>
            </View>
          )}
          {property.size_sqft && (
            <View style={styles.featureItem}>
              <IconRuler size={20} color="#374151" />
              <Text style={styles.featureText}>{property.size_sqft} sqft</Text>
            </View>
          )}
        </View>

        <Pressable 
          style={[
            styles.viewOnMapButton,
            selectedRealEstateProperty?.property_id === property.property_id && styles.viewOnMapButtonSelected
          ]}
          onPress={() => handleViewOnMap(property)}>
          <IconMap size={18} color="#fff" />
          <Text style={styles.viewOnMapText}>View on Map</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  const isStepValid = () => {
    switch (currentPage) {
      case 1:
        return rentOrBuy !== null;
      case 2:
        return true; // No validation needed as we have default values
      case 3:
        return minPrice !== null && maxPrice !== null;
      case 4:
        return wantPropertyRecommendationAge !== null && 
          (!wantPropertyRecommendationAge || (wantPropertyRecommendationAge && propertyRecommendationAge !== ''));
      case 5:
        return true; // Location is optional
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (isStepValid()) {
      nextPage();
    }
  };

  return (
    <View style={recommendationProperties && recommendationProperties.length > 0 ? styles.sideModal : styles.modal}>
      <Pressable 
        style={styles.closeButton} 
        onPress={handleClose}
      >
        <IconX size={20} color="#6B7280" />
      </Pressable>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {
        recommendationProperties.length === 0 && (
          <View style={{ flex: 1 }}>
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
                      <View style={[
                        styles.choiceIconContainer,
                        rentOrBuy === 'rent' && styles.choiceIconContainerActive
                      ]}>
                        <IconHome size={24} color={rentOrBuy === 'rent' ? '#ffffff' : '#666666'} />
                      </View>
                      <Text style={[styles.choiceTitle, rentOrBuy === 'rent' && styles.choiceTitleActive]}>Renting</Text>
                      <Text style={[styles.choiceDescription, rentOrBuy === 'rent' && styles.choiceDescriptionActive]}>
                        Find properties available for rent
                      </Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.choiceCard, rentOrBuy === 'buy' && styles.choiceCardActive]} 
                      onPress={() => handlePageOne('buy')}>
                      <View style={[
                        styles.choiceIconContainer,
                        rentOrBuy === 'buy' && styles.choiceIconContainerActive
                      ]}>
                        <IconKey size={24} color={rentOrBuy === 'buy' ? '#ffffff' : '#666666'} />
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
                      onPress={() => setWantPropertyRecommendationAge(true)}>
                      <View style={[
                        styles.choiceIconContainer,
                        wantPropertyRecommendationAge === true && styles.choiceIconContainerActive
                      ]}>
                        <IconHome size={24} color={wantPropertyRecommendationAge === true ? '#ffffff' : '#666666'} />
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
                        setPropertyRecommendationAge('')
                      }}>
                      <View style={[
                        styles.choiceIconContainer,
                        wantPropertyRecommendationAge === false && styles.choiceIconContainerActive
                      ]}>
                        <IconHome size={24} color={wantPropertyRecommendationAge === false ? '#ffffff' : '#666666'} />
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
                        <Picker.Item label="Select your age" value="" />
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
                  <View style={styles.pageContent}>
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
                              <Text style={styles.predictionsText}>{prediction.description}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>

                    {recommendedPlaces.length > 0 && (
                      <View style={styles.recommendedPlacesContainer}>
                        <Text style={styles.recommendedPlacesTitle}>Selected Locations</Text>
                        {recommendedPlaces.map((place, index) => (
                          <View key={`place-${place.address}-${index}`} style={styles.recommendedPlaceItem}>
                            <Text style={styles.recommendedPlaceText}>{place.address}</Text>
                            <Pressable
                              style={styles.removeButton}
                              onPress={() => {
                                setRecommendedPlaces(prev => prev.filter((_, i) => i !== index));
                              }}>
                              <IconX size={16} color="#6B7280" />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
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
                  style={[
                    styles.primaryButton, 
                    styles.navigationButton,
                    !isStepValid() && styles.primaryButtonDisabled
                  ]} 
                  onPress={handleNextStep}
                  disabled={!isStepValid()}>
                  <Text style={[
                    styles.primaryButtonText,
                    !isStepValid() && styles.primaryButtonTextDisabled
                  ]}>Continue</Text>
                  <IconArrowRight size={20} color={isStepValid() ? "#ffffff" : "#9CA3AF"} />
                </Pressable>
              )}

              {currentPage === 5 && (
                <Pressable 
                  style={[styles.primaryButton, styles.navigationButton]} 
                  onPress={handleNextStep}>
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <IconArrowRight size={20} color="#ffffff" />
                </Pressable>
              )}
            </View>
          </View>
        )
      }

      {currentPage === 6 && !isLoading && recommendationProperties.length > 0 && (
        <View style={styles.recommendedPropertiesContainer}>
          <Text style={styles.pageTitle}>Recommended Properties</Text>
          <Text style={styles.pageSubtitle}>Based on your preferences</Text>
          <FlatList
            style={styles.propertyList}
            data={recommendationProperties}
            keyExtractor={(item) => item.property_id.toString()}
            renderItem={({ item }) => (
              <Pressable
                id={`property-${item.property_id}`}
                style={[
                  styles.recommendedPropertyCard,
                  selectedRealEstateProperty?.property_id === item.property_id && styles.recommendedPropertyCardSelected
                ]}
                onPress={() => handlePropertySelect(item)}
              >
                <View style={styles.propertyImageContainer}>
                  <Image
                    source={{ uri: item.img_url }}
                    style={styles.propertyImage}
                    resizeMode="cover"
                  />
                  <View style={styles.propertyBadge}>
                    <Text style={styles.propertyStatus}>
                      {item.status === 'for_sale' ? 'For Sale' : item.status}
                    </Text>
                  </View>
                  <View style={styles.propertyPriceBadge}>
                    <Text style={styles.propertyPriceText}>{item.price}</Text>
                  </View>
                </View>
                <View style={styles.propertyContent}>
                  <View style={styles.propertyHeader}>
                    <View style={styles.propertyTitleSection}>
                      <Text style={styles.propertyType}>{item.property_type}</Text>
                      <Text style={styles.propertyAddress}>{item.address_line}</Text>
                    </View>
                  </View>
                  <View style={styles.propertyFeatureGrid}>
                    <View style={styles.featureItem}>
                      <IconBed size={18} color="#374151" />
                      <Text style={styles.featureText}>{item.num_beds || '-'} Beds</Text>
                    </View>
                    {item.num_baths && (
                      <View style={styles.featureItem}>
                        <IconBath size={18} color="#374151" />
                        <Text style={styles.featureText}>{item.num_baths} Baths</Text>
                      </View>
                    )}
                    {item.size_sqft && (
                      <View style={styles.featureItem}>
                        <IconRuler size={18} color="#374151" />
                        <Text style={styles.featureText}>{item.size_sqft} sqft</Text>
                      </View>
                    )}
                  </View>
                  <Pressable
                    style={[
                      styles.viewOnMapButton,
                      selectedRealEstateProperty?.property_id === item.property_id && styles.viewOnMapButtonSelected
                    ]}
                    onPress={() => handleViewOnMap(item)}
                  >
                    <IconMap size={18} color="#ffffff" />
                    <Text style={styles.viewOnMapText}>View on Map</Text>
                  </Pressable>
                </View>
              </Pressable>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.recommendedPropertiesContent}
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
    width: '65%',
    maxWidth: 800,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 9999999999
  },
  sideModal: {
    position: 'absolute',
    top: 110,
    left: 24,
    width: '35%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      ':hover': {
        transform: [{ translateY: -2 }],
        borderColor: '#49a84c',
      },
    }),
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  choiceIconContainerActive: {
    backgroundColor: '#3b8c3e',
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
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      ':hover': {
        transform: [{ translateY: -2 }],
        backgroundColor: '#3b8c3e',
      },
    }),
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
  searchSection: {
    width: '100%',
    position: 'relative',
    marginTop: 16,
  },
  pageContent: {
    padding: 24,
    gap: 16,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    position: 'absolute',
    right: -12,
    top: -12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      ':hover': {
        backgroundColor: '#F9FAFB',
      },
    }),
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
  recommendedPropertyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 420,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease-in-out',
      ':hover': {
        transform: [{ translateY: -4 }],
        shadowOpacity: 0.15,
      },
    }),
  },
  recommendedPropertyCardSelected: {
    borderColor: '#49a84c',
    borderWidth: 2,
    backgroundColor: '#fafffe',
  },
  propertyContent: {
    padding: 16,
    minHeight: 200,
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  recommendedPropertiesContainer: {
    flex: 1,
    width: '100%',
    padding: 16,
  },
  propertyList: {
    flex: 1,
  },
  recommendedPropertiesContent: {
    paddingTop: 16,
    gap: 12,
  },
  propertyImageContainer: {
    position: 'relative',
    height: 220,
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
    borderRadius: 8,
  },
  propertyPriceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#49a84c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  propertyStatus: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  propertyPriceText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  propertyHeader: {
    marginBottom: 20,
  },
  propertyTitleSection: {
    gap: 6,
  },
  propertyType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#49a84c',
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
    gap: 12,
    marginBottom: 'auto',
    paddingBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 'auto',
    shadowColor: '#49a84c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      ':hover': {
        backgroundColor: '#3b8c3e',
      },
    }),
  },
  viewOnMapButtonSelected: {
    backgroundColor: '#3b8c3e',
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
  searchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    ...(Platform.OS === 'web' && {
      outlineWidth: 0,
    }),
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
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  predictionsItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      ':hover': {
        backgroundColor: '#F9FAFB',
      },
    }),
  },
  predictionsText: {
    fontSize: 15,
    color: '#374151',
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      ':hover': {
        backgroundColor: '#F9FAFB',
      },
    }),
  },
  recommendedPlacesContainer: {
    marginTop: 24,
  },
  recommendedPlacesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  recommendedPlaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendedPlaceText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
});