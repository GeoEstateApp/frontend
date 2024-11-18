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
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text style={styles.placeAddress}>{place.address}</Text>
                  <View style={styles.statsContainer}>
                    <View style={styles.stat}>
                      <IconTrendingUp size={16} />
                      <Text style={styles.statText}>
                        {place.popularity} saves
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'similar':
        return (
          <ScrollView style={styles.scrollView}>
            {similarUsers.map((user) => (
              <TouchableOpacity
                key={user.userid}
                style={styles.userCard}
                onPress={() => {
                  setViewMode('explore');
                  setSearchQuery(user.username);
                  handleSearch();
                }}
              >
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.username}</Text>
                  <View style={styles.userStatsContainer}>
                    <View style={styles.userStat}>
                      <IconPercentage size={16} color="#007AFF" />
                      <Text style={styles.userStats}>
                        {Math.round((user.common_places / user.total_places) * 100)}% similar
                      </Text>
                    </View>
                    <View style={styles.userStat}>
                      <IconMapPin size={16} color="#666" />
                      <Text style={styles.userBio}>
                        {user.total_places} places saved
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.commonPlaces}>
                    Common places: {user.common_locations.join(', ')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
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
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userStats: {
    fontSize: 14,
    color: '#007AFF',
  },
  userBio: {
    fontSize: 14,
    color: '#666',
  },
  commonPlaces: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});