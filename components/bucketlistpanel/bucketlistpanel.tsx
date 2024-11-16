import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { getBucketList, removeFromBucketList, BucketListItem } from '../../api/bucketlist';
import { IconList, IconSearch, IconTrash, IconUser, IconUsers } from '@tabler/icons-react';
import Toast from 'react-native-toast-message';
import { useBucketListPanelStore } from '@/states/bucketlistpanel';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BucketListPanel() {
  const { showPanel } = useBucketListPanelStore();
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
        if (storedUsername) {
          fetchBucketList(storedUsername);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

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
    if (username) {
      setViewMode('own');
      setSearchUsername('');
      fetchBucketList(username);
    }
  };

  if (!showPanel) return null;

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Bucket List</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'own' && styles.activeTab]}
          onPress={handleViewOwnList}
        >
          <IconUser size={20} color={viewMode === 'own' ? '#fff' : '#000'} />
          <Text style={[styles.tabText, viewMode === 'own' && styles.activeTabText]}>My List</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'search' && styles.activeTab]}
          onPress={() => setViewMode('search')}
        >
          <IconUsers size={20} color={viewMode === 'search' ? '#fff' : '#000'} />
          <Text style={[styles.tabText, viewMode === 'search' && styles.activeTabText]}>Search Users</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'search' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter username"
            value={searchUsername}
            onChangeText={setSearchUsername}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearch}
          >
            <IconSearch size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.centerText}>Loading...</Text>
          </View>
        ) : bucketList.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.centerText}>
              {viewMode === 'own' 
                ? "You haven't added any places to your bucket list yet"
                : "No places found in bucket list"}
            </Text>
          </View>
        ) : (
          <>
            {viewMode === 'search' && searchUsername && (
              <Text style={styles.subtitle}>Showing bucket list for: {searchUsername}</Text>
            )}
            {bucketList.map((item) => (
              <TouchableOpacity
                key={`${item.place_id}-${item.userid}`}
                style={styles.listItem}
                onPress={() => {
                  Toast.show({
                    type: 'info',
                    text1: item.name,
                    text2: item.address,
                    visibilityTime: 2000,
                  });
                }}
              >
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemAddress}>{item.address}</Text>
                </View>
                {viewMode === 'own' && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemove(item.place_id)}
                  >
                    <IconTrash size={20} color="#ff4444" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 400,
    height: '100%',
    backgroundColor: '#fff',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
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
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    color: '#000',
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
});
