import { View, Text, StyleSheet, Pressable, ScrollView, Image, ActivityIndicator } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { IconFilter, IconHeart, IconHeartFilled, IconBookmark, IconBookmarkFilled, IconRowRemove, IconTrashX } from '@tabler/icons-react';
import { useSidePanelStore } from '@/states/sidepanel';
import { useFavoritesPanelStore } from '@/states/favoritespanel';
import { useBucketListPanelStore } from '@/states/bucketlistpanel';
import { getPlaceInsights, PlaceInsight } from '@/api/insights';
import { SUPPORTED_FILTERS_MAP, UI_FILTERS } from '@/const/filters';
import { useInsightsStore } from '@/states/insights';
import Toast from 'react-native-toast-message';
import { addFavorite, getFavorites, removeFavorite, FavoriteItem } from '@/api/favorites';
import { addToBucketList, removeFromBucketList, getBucketList } from '@/api/bucketlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Animated } from 'react-native';
import { auth } from '@/lib/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useFilterStore } from '@/states/filterstore';
import { useMapStore } from '@/states/map';

export default function SidePanel() {
  const { toggleFavPanel, showFavPanel, setShowFavPanel } = useFavoritesPanelStore()
  const { toggleBucketListPanel, showBucketListPanel, setShowBucketListPanel } = useBucketListPanelStore()
  const { reset: resetSidePanel, selectedPlace, setSidePanelPlace, realEstateProperties, setSelectedRealEstateProperty, selectedRealEstateProperty } = useSidePanelStore()
  const { setGoToPlace } = useMapStore()

  const { insights, setInsights } = useInsightsStore()

  const { selectedFilters, setSelectedFilters } = useFilterStore()
  const [callFilterAPI, setCallFilterAPI] = useState(false)
  const [loadingFilters, setLoadingFilters] = useState<string[]>([])

  const [imageUri, setImageUri] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isInBucketList, setIsInBucketList] = useState(false)
  const [favorites, setFavorites] = useState<any[]>([])
  const [bucketList, setBucketList] = useState<any[]>([])
  const [username, setUsername] = useState<string>('');
  const [userid, setUserid] = useState<string | null>(null);
  const [realEstateFilter, setRealEstateFilter] = useState<'all' | 'for_sale' | 'for_rent'>('all');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // User is signed out, so
        // reset all panel states when logged out
        setShowFavPanel(false)
        setShowBucketListPanel(false)
        setSelectedFilters([])
        setImageUri(null)
        setIsFavorite(false)
        setIsInBucketList(false)
        setFavorites([])
        setBucketList([])
        setUsername('')
        setUserid(null)
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => { }, [realEstateProperties])

  useEffect(() => {
    if (!selectedPlace) return

    if (selectedPlace.photosUrl.length <= 0) {
      setImageUri("./assets/images/placeholder-image.jpg")
      return
    }

    setImageUri(selectedPlace.photosUrl[0])
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % selectedPlace.photosUrl.length
      setImageUri(selectedPlace.photosUrl[currentIndex])
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedPlace, selectedPlace?.photosUrl])

  useEffect(() => {
    if (!callFilterAPI) return
    if (!selectedPlace) return

    const fetchInsights = async () => {
      try {
        const insights: PlaceInsight[] = await getPlaceInsights(selectedPlace.lat, selectedPlace.lng, selectedFilters) || []
        setInsights(insights)
      } catch (error) {
        console.error('Error fetching insights:', error)
        Toast.show({
          type: 'error',
          text1: 'Error loading insights',
          text2: 'Please try again',
        })
      } finally {
        setLoadingFilters([])
        setCallFilterAPI(false)
      }
    }

    fetchInsights()
  }, [selectedFilters])

  useEffect(() => {
    const loadUsername = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    };
    loadUsername();
  }, []);

  useEffect(() => {
    const loadUserid = async () => {
      try {
        const storedUserid = await AsyncStorage.getItem('uid');
        if (storedUserid) {
          setUserid(storedUserid);
        }
      } catch (error) {
        console.error('Error loading userid:', error);
      }
    };
    loadUserid();
  }, []);

  // Only load bucket list when bucket list panel is shown
  useEffect(() => {
    const loadBucketList = async () => {
      if (!showBucketListPanel) return;
      try {
        const userBucketList = await getBucketList();
        setBucketList(userBucketList);
      } catch (error) {
        console.error('Error loading bucket list:', error);
      }
    };
    loadBucketList();
  }, [showBucketListPanel]);

  // Check if selected place is in bucket list
  useEffect(() => {
    const checkBucketListStatus = async () => {
      if (!selectedPlace) {
        setIsInBucketList(false);
        return;
      }
      try {
        const userBucketList = await getBucketList();
        setIsInBucketList(userBucketList.some((item: any) => item.place_id === selectedPlace.placeId));
      } catch (error) {
        console.error('Error checking bucket list status:', error);
        setIsInBucketList(false);
      }
    };
    checkBucketListStatus();
  }, [selectedPlace]);

  // Load favorites when favorites panel is shown
  useEffect(() => {
    const loadFavorites = async () => {
      if (!showFavPanel) return;
      try {
        const userFavorites = await getFavorites();
        setFavorites(userFavorites);
      } catch (error) {
        console.error('Error loading favorites:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Could not load favorites. Please try again.',
        });
      }
    };
    loadFavorites();
  }, [showFavPanel]);

  // Check if selected place is favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!selectedPlace || !userid) {
        setIsFavorite(false);
        return;
      }
      try {
        const userFavorites = await getFavorites();
        const isFav = userFavorites.some((item: any) => item.place_id === selectedPlace.placeId);
        console.log('Checking favorite status:', { placeId: selectedPlace.placeId, isFav, favoritesCount: userFavorites.length });
        setIsFavorite(isFav);
      } catch (error) {
        console.error('Error checking favorite status:', error);
        setIsFavorite(false);
      }
    };
    checkFavoriteStatus();
  }, [selectedPlace, userid]);

  const handleFavoriteToggle = async () => {
    try {
      if (!selectedPlace) {
        Toast.show({
          type: 'error',
          text1: 'No place selected',
        });
        return;
      }

      if (!selectedPlace.placeId) {
        throw new Error("Place ID is required");
      }

      if (!userid) {
        Toast.show({
          type: 'error',
          text1: 'Authentication required',
          text2: 'Please log in to use the favorites feature',
        });
        return;
      }

      if (isFavorite) {
        // Remove from favorites
        await removeFavorite(selectedPlace.placeId);
        setIsFavorite(false);
      } else {
        // Add to favorites
        await addFavorite({
          place_id: selectedPlace.placeId,
          name: selectedPlace.name || '',
          address: selectedPlace.address || '',
          latitude: selectedPlace.lat || 0,
          longitude: selectedPlace.lng || 0,
        });
        setIsFavorite(true);
      }

      // Always refresh favorites list to keep it in sync
      const updatedFavorites = await getFavorites();
      setFavorites(updatedFavorites);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: isFavorite ? 'Removed from favorites' : 'Added to favorites',
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Could not update favorite. Please try again.',
        visibilityTime: 3000,
      });
    }
  };

  const handleBucketList = async () => {
    if (!selectedPlace) {
      Toast.show({
        type: 'error',
        text1: 'No place selected',
      });
      return;
    }

    if (!userid) {
      Toast.show({
        type: 'error',
        text1: 'Authentication required',
        text2: 'Please log in to use the bucket list feature',
      });
      return;
    }

    try {
      if (isInBucketList) {
        await removeFromBucketList(selectedPlace.placeId);
        setIsInBucketList(false);
        Toast.show({
          type: 'success',
          text1: 'Removed from bucket list',
        });
      } else {
        await addToBucketList({
          place_id: selectedPlace.placeId,
          name: selectedPlace.name || '',
          address: selectedPlace.address || '',
          latitude: selectedPlace.lat || 0,
          longitude: selectedPlace.lng || 0,
        });
        setIsInBucketList(true);
        Toast.show({
          type: 'success',
          text1: 'Added to bucket list',
        });
      }

      // Refresh bucket list if panel is open
      if (showBucketListPanel) {
        const username = await AsyncStorage.getItem('username');
        if (username) {
          const updatedBucketList = await getBucketList(username);
          setBucketList(updatedBucketList);
        }
      }
    } catch (error) {
      console.error('Error updating bucket list:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Could not update bucket list. Please try again.',
        visibilityTime: 3000,
      });
    }
  };

  const handleOnFilterPress = async (filter: string) => {
    if (!selectedPlace) {
      Toast.show({
        type: 'error',
        text1: 'No place selected',
        text2: 'Please select a place to see insights',
        autoHide: true,
        visibilityTime: 5000,
        text1Style: { fontSize: 16, fontWeight: 'bold' },
        text2Style: { fontSize: 14 },
      })
      return
    }

    // Prevent any filter selection if any filter is loading
    if (loadingFilters.length > 0) return

    if (loadingFilters.includes(filter)) return // Prevent selecting a filter that's already loading

    const map3dElement = document.getElementsByTagName('gmp-map-3d')[0]
    if (!map3dElement) return

    if (selectedFilters.includes(filter)) {
      const children = Array.from(map3dElement.children)
      children.forEach(child => {
        const type = child.id.split('-')[0]
        if (type === filter) map3dElement.removeChild(child)
      })
      setSelectedFilters(selectedFilters.filter(f => f !== filter))
      if (insights && insights.length > 0) setInsights(insights.filter(insight => insight.type !== filter))
    } else {
      setLoadingFilters([...loadingFilters, filter])
      setSelectedFilters([...selectedFilters, filter])
      setCallFilterAPI(true)

      Toast.show({
        type: 'info',
        text1: 'Loading insights...',
        text2: 'Insights will be highlighted on the map',
        autoHide: true,
        visibilityTime: 5000,
        text1Style: { fontSize: 16, fontWeight: 'bold' },
        text2Style: { fontSize: 14 }
      })
    }
  }

  const handleFilterClick = () => {
    if (showFavPanel) setShowFavPanel(false)
    if (showBucketListPanel) setShowBucketListPanel(false)
  }

  const handleFavoritesClick = () => {
    if (showFavPanel) setShowFavPanel(false)
    if (showBucketListPanel) setShowBucketListPanel(false)
  }

  const handleBucketListClick = () => {
    if (showBucketListPanel) {
      setShowBucketListPanel(false)
    } else {
      setShowFavPanel(false)
      setShowBucketListPanel(true)
    }
  }

  const handleRemoveInsights = () => {
    setSelectedFilters([])
    setInsights([])
  }

  const filteredRealEstateProperties = realEstateProperties?.filter(property => {
    if (realEstateFilter === 'all') return true;
    return property.status === realEstateFilter;
  });

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        {
          !selectedPlace ? (
            <View style={styles.noPlaceContainer}>
                <Text style={styles.noPlaceHeading}>
                No place selected
                </Text>

                <Text style={styles.noPlaceSubHeading}>
                Select a place on the map to view insights and the details
                </Text>
            </View>

          ) : (
            <View style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ ...styles.filters, flexGrow: 0, minHeight: 40 }}
                contentContainerStyle={{ gap: 8, minHeight: 40 }}>
                {UI_FILTERS.map((filter, index) => {
                  const filterKey = filter.split(' ').join('_').toLowerCase()
                  const isSelected = selectedFilters.includes(filterKey)
                  const isLoading = loadingFilters.includes(filterKey)
                  const isDisabled = loadingFilters.length > 0 && !isLoading

                  const backgroundColor = selectedFilters.includes(filterKey) ? `${SUPPORTED_FILTERS_MAP[filterKey as keyof typeof SUPPORTED_FILTERS_MAP]?.fill.substring(0, 7) || '#E5E7EB'}` : '#F3F4F6'

                  return (
                    <Pressable
                      key={index}
                      onPress={() => handleOnFilterPress(filterKey)}
                      style={[styles.filterButton,
                      isSelected && { backgroundColor: backgroundColor },
                      (isLoading || isDisabled) && styles.filterButtonDisabled,
                      ]}>
                      {isLoading ? (
                        <ActivityIndicator size="small" color={isSelected ? "white" : "#4B5563"} />
                      ) : (
                        <Text style={[
                          styles.filterText,
                          isSelected && styles.filterTextSelected,
                          isDisabled && styles.filterTextDisabled
                        ]}>
                          {filter}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>

              {
                selectedFilters.length > 0 && (
                  <Pressable style={{ ...styles.toggleButton, width: 'auto', backgroundColor: '#ff4444', marginTop: 10 }} onPress={handleRemoveInsights}>
                    <IconTrashX size={24} color="#fff" />
                  </Pressable>
                )
              }

                <Pressable style={styles.selectedPlace} onPress={() => setGoToPlace(Math.floor(Math.random() * 100) + 1)}>
                  <Image source={{ uri: imageUri || selectedPlace.photosUrl[0] }} style={{ width: 400, height: 300, objectFit: 'cover' }} />
                  <View style={styles.placeHeader}>
                    <Text style={styles.placeTitle}>{selectedPlace.address}</Text>
                    <View style={styles.actionButtons}>
                    <Pressable onPress={handleFavoriteToggle}>
                      {isFavorite ? (
                      <IconHeartFilled size={24} color="#ff4444" />
                      ) : (
                      <IconHeart size={24} color="#000" />
                      )}
                    </Pressable>
                    <Pressable onPress={handleBucketList} style={{ marginLeft: 10 }}>
                      {isInBucketList ? (
                      <IconBookmarkFilled size={24} color="#4444ff" />
                      ) : (
                      <IconBookmark size={24} color="#000" />
                      )}
                    </Pressable>
                    </View>
                  </View>
                </Pressable>

              {getAuth().currentUser !== null && realEstateProperties && realEstateProperties.length > 0 && (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 24 }}>
                    Real Estate Properties
                  </Text>
                  
                  {/* Add filter buttons */}
                  <View style={styles.realEstateFilters}>
                    <Pressable 
                      style={[styles.filterButton, realEstateFilter === 'all' && styles.filterButtonSelected]}
                      onPress={() => setRealEstateFilter('all')}
                    >
                      <Text style={[styles.filterText, realEstateFilter === 'all' && styles.filterTextSelected]}>ALL</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.filterButton, realEstateFilter === 'for_sale' && styles.filterButtonSelected]}
                      onPress={() => setRealEstateFilter('for_sale')}
                    >
                      <Text style={[styles.filterText, realEstateFilter === 'for_sale' && styles.filterTextSelected]}>SALE</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.filterButton, realEstateFilter === 'for_rent' && styles.filterButtonSelected]}
                      onPress={() => setRealEstateFilter('for_rent')}
                    >
                      <Text style={[styles.filterText, realEstateFilter === 'for_rent' && styles.filterTextSelected]}>RENT</Text>
                    </Pressable>
                  </View>

                  <ScrollView 
                    style={{ flex: 1 }}
                    contentContainerStyle={{ gap: 8 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {(filteredRealEstateProperties || []).map((property, index) => (
                      <Pressable 
                        style={[
                          styles.realEstateProperty, 
                          selectedRealEstateProperty?.property_id === property.property_id && { backgroundColor: '#49A84C' }
                        ]} 
                        key={index} 
                        onPress={() => setSelectedRealEstateProperty(property)}
                      >
                        <Image source={{ uri: property.img_url }} style={{ width: 100, objectFit: 'cover', borderRadius: 6 }} />
                        <View style={{ gap: 4, display: 'flex', flexDirection: 'column' }}>
                          <Text style={{ fontSize: 16, fontWeight: 'bold', color: selectedRealEstateProperty?.property_id === property.property_id ? 'white' : 'black' }}>{property.address_line}</Text>
                          <Text style={{ fontSize: 14, color: selectedRealEstateProperty?.property_id === property.property_id ? 'white' : 'black' }}>Property: {property.property_type.split('_').join(' ').toUpperCase()}</Text>
                          {property.size_sqft && <Text style={{ fontSize: 14, color: selectedRealEstateProperty?.property_id === property.property_id ? 'white' : 'black' }}>Size: {property.size_sqft} ft²</Text>}
                          <Text style={{ fontSize: 14, color: selectedRealEstateProperty?.property_id === property.property_id ? 'white' : 'black' }}>{property.price}</Text>
                          <Text style={{ fontSize: 12, color: selectedRealEstateProperty?.property_id === property.property_id ? 'white' : 'black' }}>{property.status.split('_').join(' ').toUpperCase()}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {!getAuth().currentUser && (
                <View style={styles.loginPrompt}>
                  <Text style={styles.loginPromptText}>
                    Please login to get real estate recommendations
                  </Text>
                </View>
              )}
            </View>
          )
        }

      </View>
    </View>
  )
}

//const isSmallScreen = window.innerWidth <= 700;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: '100%',
    left: 0,
    top: 0, 
  },
  
  buttonContainer: {
    position: 'absolute',
    left: 10,
    top: 10 ,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    zIndex: 1000,
  },
  buttonContainerMoved: {
    left: 410,
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 400,
    height: '100%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderRightWidth: 1,
    borderColor: 'rgba(221, 221, 221, 0.5)',
    flex: 1, // Add this
  },
  filters: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'nowrap',
  },
  selectedPlace: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'white',
    overflow: 'hidden',
    borderRadius: 12,
    marginTop: 20,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  noPlaceContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    margin: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noPlaceHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  noPlaceSubHeading: {
    fontSize: 16,
    textAlign: 'center',
    color: '#64748b',
    lineHeight: 24,
    maxWidth: 280,
    fontWeight: '500',
  },
  placeHeader: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    gap: 10
  },
  placeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
  },
  realEstateProperty: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    cursor: 'pointer',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    width: 48,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
  },
  favoriteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  favoritesList: {
    flex: 1,
    padding: 16,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  favoriteContent: {
    flex: 1,
    marginRight: 16,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  favoriteAddress: {
    fontSize: 14,
    color: '#666',
  },
  removeFavoriteButton: {
    padding: 8,
  },
  filterButton: {
    flexShrink: 0,
    flexGrow: 0,
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#f3f4f6', // Add this default grey color
  },
  filterButtonSelected: {
    backgroundColor: '#49A84C',
    borderColor: 'transparent',
  },
  filterButtonDisabled: {
    opacity: 0.7,
  },
  filterText: {
    color: '#4B5563',
    fontWeight: '500',
    fontSize: 14,
  },
  filterTextSelected: {
    color: 'white',
  },
  filterTextDisabled: {
    opacity: 0.5,
  },
  loginPrompt: {
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginTop: 24,
    alignItems: 'center',
  },
  loginPromptText: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
  },
  realEstateFilters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
})