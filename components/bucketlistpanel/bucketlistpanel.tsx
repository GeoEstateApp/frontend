import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { getBucketList, removeFromBucketList, BucketListItem } from '../../api/bucketlist';
import { IconList, IconSearch, IconTrash, IconUser, IconUsers, IconMapPin, IconX } from '@tabler/icons-react';
import Toast from 'react-native-toast-message';
import { useBucketListPanelStore } from '@/states/bucketlistpanel';
import { useMapStore } from '@/states/map';
import { useSidePanelStore } from '@/states/sidepanel';
import { useFavoritesPanelStore } from '@/states/favoritespanel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DiscoveryFeed from './discoveryfeed';

export default function BucketListPanel() {
  const { showBucketListPanel, setShowBucketListPanel } = useBucketListPanelStore();
  const { setSelectedPlace } = useMapStore();
  const { setShowPanel: setShowSidePanel } = useSidePanelStore();
  const { setShowFavPanel } = useFavoritesPanelStore();
  const [searchUsername, setSearchUsername] = useState('');
  const [bucketList, setBucketList] = useState<BucketListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [userid, setUserid] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'own' | 'search'>('own');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserid = await AsyncStorage.getItem('uid');
        const storedUsername = await AsyncStorage.getItem('username');
        setUserid(storedUserid);
        setUsername(storedUsername);
        if (storedUsername && viewMode === 'own') {
          fetchBucketList(storedUsername);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, [viewMode]);

  const fetchBucketList = async (targetUsername: string) => {
    setLoading(true);
    try {
      const data = await getBucketList(targetUsername);
      setBucketList(data);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (place_id: string) => {
    try {
      await removeFromBucketList(place_id);
      // Refresh the list
      if (username && viewMode === 'own') {
        fetchBucketList(username);
      } else if (searchUsername && viewMode === 'search') {
        fetchBucketList(searchUsername);
      }
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Removed from bucket list',
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message,
      });
    }
  };

  const handleSearch = async () => {
    if (!searchUsername.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a username to search',
      });
      return;
    }
    setViewMode('search');
    setLoading(true);
    try {
      const data = await getBucketList(searchUsername.trim());
      setBucketList(data);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewOwnList = () => {
    setViewMode('own');
    setSearchUsername('');
    if (username) {
      fetchBucketList(username);
    }
  };

  const handleViewSearch = () => {
    setViewMode('search');
    setBucketList([]); // Clear the bucket list when switching to search
    setSearchUsername('');
  };

  if (!showBucketListPanel) return null;

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Bucket List</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'own' && styles.activeTab]}
          onPress={() => setViewMode('own')}
        >
          <IconUser size={20} color={viewMode === 'own' ? '#fff' : '#000'} />
          <Text style={[styles.tabText, viewMode === 'own' && styles.activeTabText]}>My List</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'search' && styles.activeTab]}
          onPress={() => setViewMode('search')}
        >
          <IconUsers size={20} color={viewMode === 'search' ? '#fff' : '#000'} />
          <Text style={[styles.tabText, viewMode === 'search' && styles.activeTabText]}>Discover</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'search' ? (
        <DiscoveryFeed />
      ) : (
        <ScrollView style={styles.listContainer}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.centerText}>Loading...</Text>
            </View>
          ) : bucketList.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.centerText}>
                You haven't added any places to your bucket list yet
              </Text>
            </View>
          ) : (
            <>
              {bucketList.map((item) => (
                <View
                  key={`${item.place_id}-${item.userid}`}
                  style={styles.listItem}
                >
                  <View style={styles.itemContent}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemAddress}>{item.address}</Text>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.travelButton]}
                      onPress={() => {
                        // Close all panels
                        setShowBucketListPanel(false);
                        setShowSidePanel(false);
                        setShowFavPanel(false);
                        
                        // Navigate to location
                        setSelectedPlace({
                          place_id: item.place_id,
                          name: item.name,
                          formatted_address: item.address,
                          geometry: {
                            location: {
                              lat: () => item.latitude,
                              lng: () => item.longitude
                            }
                          }
                        } as google.maps.places.PlaceResult);

                        Toast.show({
                          type: 'success',
                          text1: 'Navigating to location',
                          text2: item.name,
                          visibilityTime: 2000,
                        });
                      }}
                    >
                      <IconMapPin size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.removeButton]}
                      onPress={() => handleRemove(item.place_id)}
                    >
                      <IconX size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    zIndex: 1000,
    borderRightWidth: 1,
    borderColor: 'rgba(221, 221, 221, 0.5)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 8,
    backgroundColor: '#f3f4f6',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    color: '#4b5563',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchButton: {
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  centerText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
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
  itemContent: {
    flex: 1,
    marginRight: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#374151',
  },
  itemAddress: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  travelButton: {
    backgroundColor: '#10b981',
  },
  removeButton: {
    backgroundColor: '#f43f5e',
  },
});
