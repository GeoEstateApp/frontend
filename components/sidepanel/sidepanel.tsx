import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { IconFilter, IconHeart, IconHeartFilled, IconBookmark, IconBookmarkFilled } from '@tabler/icons-react';
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

export default function SidePanel() {
  const { toggleFavPanel, showFavPanel, setShowFavPanel } = useFavoritesPanelStore()
  const { toggleBucketListPanel, showBucketListPanel, setShowBucketListPanel } = useBucketListPanelStore()
 
  const { insights, setInsights } = useInsightsStore()
 
  const { selectedPlace, realEstateProperties, setSelectedRealEstateProperty, selectedRealEstateProperty } = useSidePanelStore()
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [callFilterAPI, setCallFilterAPI] = useState(false)

  const [imageUri, setImageUri] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isInBucketList, setIsInBucketList] = useState(false)
  const [favorites, setFavorites] = useState<any[]>([])
  const [bucketList, setBucketList] = useState<any[]>([])
  const [username, setUsername] = useState<string>('');
  const [userid, setUserid] = useState<string | null>(null);

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
    const includingFilters = selectedFilters.map(filter => filter)

    const fetchInsights = async () => {
      const insights: PlaceInsight[] = await getPlaceInsights(selectedPlace.lat, selectedPlace.lng, includingFilters) || []
      setInsights(insights)
      setCallFilterAPI(false)
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

  // Only load favorites when favorites panel is shown
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
    if (!selectedPlace || !favorites) return;
    const isFav = favorites.some(fav => fav.place_id === selectedPlace.placeId);
    setIsFavorite(isFav);
  }, [selectedPlace, favorites]);

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
      
      if (isFavorite) {
        // Remove from favorites
        await removeFavorite(selectedPlace.placeId);
      } else {
        // Add to favorites
        await addFavorite({
          place_id: selectedPlace.placeId,
          name: selectedPlace.name || '',
          address: selectedPlace.address || '',
          latitude: selectedPlace.lat || 0,
          longitude: selectedPlace.lng || 0,
        });
      }
      
      // Refresh favorites list
      const updatedFavorites = await getFavorites();
      setFavorites(updatedFavorites);
      
      // Update UI state
      setIsFavorite(!isFavorite);
      
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

    if (selectedFilters.includes(filter)) {
      const map3dElement = document.getElementsByTagName('gmp-map-3d')[0]
      if (!map3dElement) return

      const children = Array.from(map3dElement.children)
      children.forEach(child => {
        const type = child.id.split('-')[0]
        if (type === filter) map3dElement.removeChild(child)
      })

      setSelectedFilters(selectedFilters.filter(f => f !== filter))
      if (insights && insights.length > 0) setInsights(insights.filter(insight => insight.type !== filter))
    } else {
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

  return (
    <View style={styles.container}>
        <View style={styles.panel}>
          {
            selectedPlace && (
              <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={{...styles.filters, flexGrow: 0, minHeight: 40 }}
              contentContainerStyle={{ gap: 8, minHeight: 40 }}>
                {UI_FILTERS.map((filter, index) => {
                  const filterKey = filter.split(' ').join('_').toLowerCase()

                  return (
                    <Pressable
                      key={index}
                      onPress={() => handleOnFilterPress(filterKey)}
                      style={[{
                        flexShrink: 0,
                        flexGrow: 0,
                        height: 40,
                        padding: 10,
                        borderRadius: 5,
                        backgroundColor: selectedFilters.includes(filterKey) ? `${SUPPORTED_FILTERS_MAP[filterKey as keyof typeof SUPPORTED_FILTERS_MAP]?.fill.substring(0, 7) || 'grey'}` : 'grey',
                      }]}>
                        <Text style={{ color: selectedFilters.includes(filterKey) ? 'white' : 'white' }}>
                          {filter}
                        </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )
          }

          {selectedPlace && (
            <View style={styles.selectedPlace}>
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
            </View>
              )
          }

          { realEstateProperties && realEstateProperties.length > 0 && <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 24 }}>Real Estate Properties</Text> }
          <ScrollView showsVerticalScrollIndicator={false}>
            {
              realEstateProperties && realEstateProperties.length > 0 && (
                <View style={{ gap: 8, flexDirection: 'column' }}>
                    {
                      realEstateProperties.map((property, index) => {
                        return <Pressable style={{...styles.realEstateProperty, backgroundColor: selectedRealEstateProperty?.property_id === property.property_id ? '#49A84C' : 'white'}} key={index} onPress={() => setSelectedRealEstateProperty(property)}>
                          <Image source={{ uri: property.img_url }} style={{ width: 100, objectFit: 'cover', borderRadius: 6 }} />
                          <View style={{ gap: 4, display: 'flex', flexDirection: 'column' }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: selectedRealEstateProperty?.property_id === property.property_id ? 'white' : 'black' }}>{property.address_line}</Text>
                            <Text style={{ fontSize: 14, color: selectedRealEstateProperty?.property_id === property.property_id ? 'white' : 'black' }}>Property: {property.property_type.split('_').join(' ').toUpperCase()}</Text>
                            { property.size_sqft && <Text style={{ fontSize: 14, color: selectedRealEstateProperty?.property_id === property.property_id ? 'white' : 'black' }}>Size: {property.size_sqft} ft²</Text> }
                            <Text style={{ fontSize: 14, color: selectedRealEstateProperty?.property_id === property.property_id ? 'white' : 'black' }}>{property.price}</Text>
                            <Text style={{ fontSize: 12, color: selectedRealEstateProperty?.property_id === property.property_id ? 'white' : 'black' }}>{property.status}</Text>
                          </View>
                        </Pressable>
                      })
                    }
                </View>
              )
            }
          </ScrollView>
        
        {
          selectedPlace && selectedPlace.rating !== 0 && <Text> selectedPlace.rating </Text>
        }
    </View>
    </View>
  )
}

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
    top: 10,
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
    gap: 10,
    backgroundColor: '#ffffff99',
    width: 400,
    height: '100%',
    padding: 20,
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
    backgroundColor: '#f4f4f5',
    overflow: 'hidden',
    borderRadius: 5,
    marginTop: 20,
    paddingBottom: 10,
  },
  placeHeader: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  placeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  toggleButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    width: 48,
    height: 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
  },
  realEstateProperty: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 6,
    cursor: 'pointer'
  }
})