import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { IconHeartFilled, IconX, IconMapPin } from '@tabler/icons-react';
import { getFavorites, FavoriteItem, removeFavorite } from '@/api/favorites';
import Toast from 'react-native-toast-message';
import { useFavoritesPanelStore } from '@/states/favoritespanel';
import { useMapStore } from '@/states/map';
import { useSidePanelStore } from '@/states/sidepanel';

export default function FavoritesPanel() {
  const { showFavPanel } = useFavoritesPanelStore();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { setSelectedPlace } = useMapStore();
  const { setShowPanel: setShowSidePanel } = useSidePanelStore();
  const { setShowFavPanel } = useFavoritesPanelStore();

  const loadFavorites = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showFavPanel) {
      loadFavorites();
    }
  }, [showFavPanel]);

  const handleRemoveFavorite = async (place_id: string, name: string) => {
    try {
      await removeFavorite(place_id);
      await loadFavorites(); // Reload the list after removal
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Removed ${name} from favorites`,
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not remove from favorites. Please try again.',
      });
    }
  };

  const handleTravelTo = (favorite: FavoriteItem) => {
    setSelectedPlace({
      place_id: favorite.place_id,
      name: favorite.name,
      formatted_address: favorite.address,
      geometry: {
        location: {
          lat: () => favorite.latitude,
          lng: () => favorite.longitude
        }
      }
    } as google.maps.places.PlaceResult);

    setShowSidePanel(false);
    setShowFavPanel(false);

    Toast.show({
      type: 'success',
      text1: 'Navigating to location',
      text2: favorite.name,
      visibilityTime: 2000,
    });
  };

  if (!showFavPanel) return null;

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>My Favorites</Text>
      <ScrollView style={styles.favoritesList}>
        {loading ? (
          <Text style={styles.emptyMessage}>Loading favorites...</Text>
        ) : favorites.length === 0 ? (
          <Text style={styles.emptyMessage}>You haven't added any favorites yet!</Text>
        ) : (
          favorites.map((favorite, index) => (
            <View key={index} style={styles.favoriteItem}>
              <View style={styles.favoriteContent}>
                <Text style={styles.favoriteName}>{favorite.name}</Text>
                <Text style={styles.favoriteAddress}>{favorite.address}</Text>
              </View>
              <View style={styles.favoriteActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.travelButton]}
                  onPress={() => handleTravelTo(favorite)}
                >
                  <IconMapPin size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.removeButton]}
                  onPress={() => handleRemoveFavorite(favorite.place_id, favorite.name)}
                >
                  <IconX size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))
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
    marginBottom: 16,
  },
  favoritesList: {
    flex: 1,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
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
    fontWeight: '600',
    marginBottom: 4,
  },
  favoriteAddress: {
    fontSize: 14,
    color: '#666',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  favoriteActions: {
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
    backgroundColor: '#4CAF50',
  },
  removeButton: {
    backgroundColor: '#ff4444',
  },
});