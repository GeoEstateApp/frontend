import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { 
  getBucketList, 
  BucketListItem, 
  getPopularLocations, 
  getSimilarUsers,
  PopularLocation,
  SimilarUser,
} from '@/api/bucketlist';
import { useMapStore } from '@/states/map';
import { useSidePanelStore } from '@/states/sidepanel';
import { useBucketListPanelStore } from '@/states/bucketlistpanel';
import Toast from 'react-native-toast-message';
import { 
  IconUser, 
  IconMapPin, 
  IconSearch, 
  IconTrendingUp, 
  IconUsers, 
  IconPercentage
} from '@tabler/icons-react';

type ViewMode = 'explore' | 'popular' | 'similar';

export default function DiscoveryFeed() {
  const [searchQuery, setSearchQuery] = useState('');
  const [discoveredPlaces, setDiscoveredPlaces] = useState<BucketListItem[]>([]);
  const [popularLocations, setPopularLocations] = useState<PopularLocation[]>([]);
  const [similarUsers, setSimilarUsers] = useState<SimilarUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('popular');
  const { setSelectedPlace } = useMapStore();
  const { setShowPanel: setShowSidePanel } = useSidePanelStore();
  const { setShowBucketListPanel } = useBucketListPanelStore();

  useEffect(() => {
    if (viewMode === 'popular') {
      fetchPopularLocations();
    } else if (viewMode === 'similar') {
      fetchSimilarUsers();
    }
  }, [viewMode]);

  const fetchPopularLocations = async () => {
    setLoading(true);
    try {
      const locations = await getPopularLocations();
      setPopularLocations(locations);
    } catch (error) {
      console.error('Error fetching popular locations:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not load popular locations',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarUsers = async () => {
    setLoading(true);
    try {
      // First check if user has any bucket list items
      const myBucketList = await getBucketList();
      console.log('Current user bucket list:', myBucketList);
      
      if (!myBucketList || myBucketList.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'Add some places first',
          text2: 'Save places to your bucket list to find similar users',
        });
        setSimilarUsers([]);
        return;
      }

      if (myBucketList.length < 2) {
        Toast.show({
          type: 'info',
          text1: 'Add more places',
          text2: 'Save at least 2 places to find users with similar interests',
        });
        setSimilarUsers([]);
        return;
      }

      // If user has enough bucket list items, then look for similar users
      const users = await getSimilarUsers();
      console.log('Fetched similar users:', users);
      setSimilarUsers(users);
      
      if (!users || users.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'No matches yet',
          text2: 'No other users have saved at least 2 of the same places',
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Found similar users',
          text2: `${users.length} ${users.length === 1 ? 'user has' : 'users have'} similar interests`,
        });
      }
    } catch (error: any) {
      console.error('Error fetching similar users:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Could not load similar users',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Please enter a username',
      });
      return;
    }

    setLoading(true);
    try {
      const places = await getBucketList(searchQuery);
      setDiscoveredPlaces(places);
      
      if (places.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'No places found',
          text2: `${searchQuery} hasn't saved any places yet`,
        });
      }
    } catch (error) {
      console.error('Error discovering places:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not load places',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceClick = (place: BucketListItem | PopularLocation) => {
    setSelectedPlace({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.address,
      geometry: {
        location: {
          lat: () => place.latitude,
          lng: () => place.longitude
        }
      }
    } as google.maps.places.PlaceResult);

    setShowSidePanel(false);
    setShowBucketListPanel(false);

    Toast.show({
      type: 'success',
      text1: 'Navigating to location',
      text2: place.name,
      visibilityTime: 2000,
    });
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, viewMode === 'popular' && styles.activeTab]}
        onPress={() => setViewMode('popular')}
      >
        <IconTrendingUp size={20} color={viewMode === 'popular' ? '#fff' : '#000'} />
        <Text style={[styles.tabText, viewMode === 'popular' && styles.activeTabText]}>Trending</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, viewMode === 'similar' && styles.activeTab]}
        onPress={() => setViewMode('similar')}
      >
        <IconUsers size={20} color={viewMode === 'similar' ? '#fff' : '#000'} />
        <Text style={[styles.tabText, viewMode === 'similar' && styles.activeTabText]}>Similar Users</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, viewMode === 'explore' && styles.activeTab]}
        onPress={() => setViewMode('explore')}
      >
        <IconSearch size={20} color={viewMode === 'explore' ? '#fff' : '#000'} />
        <Text style={[styles.tabText, viewMode === 'explore' && styles.activeTabText]}>Explore</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (viewMode) {
      case 'popular':
        return (
          <ScrollView style={styles.scrollView}>
            {popularLocations.map((place) => (
              <TouchableOpacity
                key={place.place_id}
                style={styles.placeCard}
                onPress={() => handlePlaceClick(place)}
              >
                <View style={styles.placeInfo}>
                  <View style={styles.placeHeader}>
                    <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                    <View style={styles.popularityBadge}>
                      <IconTrendingUp size={14} color="#fff" />
                      <Text style={styles.popularityText}>{place.popularity}</Text>
                    </View>
                  </View>
                  <Text style={styles.placeAddress} numberOfLines={2}>{place.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {popularLocations.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No trending places yet</Text>
                <Text style={styles.emptyStateSubtext}>Be the first to add places to your bucket list!</Text>
              </View>
            )}
          </ScrollView>
        );

      case 'similar':
        return (
          <ScrollView style={styles.scrollView}>
            {similarUsers.map((user) => (
              <TouchableOpacity
                key={user.userid}
                style={styles.userCard}
                onPress={async () => {
                  setSearchQuery(user.username);
                  setViewMode('explore');
                  setLoading(true);
                  try {
                    const places = await getBucketList(user.username);
                    setDiscoveredPlaces(places);
                    
                    if (places.length === 0) {
                      Toast.show({
                        type: 'info',
                        text1: 'No places found',
                        text2: `${user.username} hasn't saved any places yet`,
                      });
                    }
                  } catch (error) {
                    console.error('Error discovering places:', error);
                    Toast.show({
                      type: 'error',
                      text1: 'Error',
                      text2: 'Could not load places',
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <View style={styles.userInfo}>
                  <View style={styles.userHeader}>
                    <View style={styles.userAvatar}>
                      <IconUser size={20} color="#666" />
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{user.username}</Text>
                      <View style={styles.similarityBadge}>
                        <IconPercentage size={14} color="#fff" />
                        <Text style={styles.similarityText}>
                          {Math.round((user.common_places / user.total_places) * 100)}% Match
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.userStats}>
                    <View style={styles.statBadge}>
                      <IconMapPin size={14} color="#666" />
                      <Text style={styles.statText}>{user.total_places} saved</Text>
                    </View>
                    <View style={styles.statBadge}>
                      <IconUsers size={14} color="#666" />
                      <Text style={styles.statText}>{user.common_places} in common</Text>
                    </View>
                  </View>
                  {user.common_locations.length > 0 && (
                    <View style={styles.commonPlacesContainer}>
                      <Text style={styles.commonPlacesLabel}>Common interests:</Text>
                      <Text style={styles.commonPlaces} numberOfLines={2}>
                        {user.common_locations.join(' • ')}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
            {similarUsers.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No similar users found</Text>
                <Text style={styles.emptyStateSubtext}>Add more places to your bucket list to find users with similar interests!</Text>
              </View>
            )}
          </ScrollView>
        );

      case 'explore':
        return (
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter a username"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <IconSearch size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
              {discoveredPlaces.map((place) => (
                <TouchableOpacity
                  key={place.place_id}
                  style={styles.placeCard}
                  onPress={() => handlePlaceClick(place)}
                >
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeAddress}>{place.address}</Text>
                    <View style={styles.statsContainer}>
                      <View style={styles.stat}>
                        <IconUser size={16} />
                        <Text style={styles.statText}>
                          Saved by {place.username || 'Anonymous'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discover Places</Text>
      {renderTabs()}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    gap: 4,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: '#000',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#fff',
  },
  tabIcon: {
    marginRight: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  searchButton: {
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  placeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  placeInfo: {
    gap: 8,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  placeAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  popularityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popularityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userInfo: {
    gap: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  similarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
  },
  similarityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  userStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statText: {
    color: '#374151',
    fontSize: 12,
  },
  commonPlacesContainer: {
    gap: 4,
  },
  commonPlacesLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  commonPlaces: {
    fontSize: 12,
    color: '#374151',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});