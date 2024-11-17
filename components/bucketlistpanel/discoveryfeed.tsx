import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { getBucketList, BucketListItem } from '@/api/bucketlist';
import { useMapStore } from '@/states/map';
import { useSidePanelStore } from '@/states/sidepanel';
import { useBucketListPanelStore } from '@/states/bucketlistpanel';
import Toast from 'react-native-toast-message';
import { IconUser, IconMapPin, IconSearch } from '@tabler/icons-react';

export default function DiscoveryFeed() {
  const [searchQuery, setSearchQuery] = useState('');
  const [discoveredPlaces, setDiscoveredPlaces] = useState<BucketListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { setSelectedPlace } = useMapStore();
  const { setShowPanel: setShowSidePanel } = useSidePanelStore();
  const { setShowPanel: setShowBucketListPanel } = useBucketListPanelStore();

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

  const handlePlaceClick = (place: BucketListItem) => {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discover Places</Text>
      <Text style={styles.subtitle}>See what others are saving</Text>
      
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

      {loading ? (
        <Text style={styles.loadingText}>Loading places...</Text>
      ) : (
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
                  <View style={styles.stat}>
                    <IconMapPin size={16} />
                    <Text style={styles.statText}>View on map</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
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
    maxHeight: '100%',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
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
});