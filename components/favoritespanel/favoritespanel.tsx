import { View, Text, StyleSheet, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { IconHeartFilled } from '@tabler/icons-react';
import { getFavorites, FavoriteItem } from '@/api/favorites';
import Toast from 'react-native-toast-message';
import { useFavoritesPanelStore } from '@/states/favoritespanel';

export default function FavoritesPanel() {
  const { showFavPanel } = useFavoritesPanelStore();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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

    if (showFavPanel) {
      loadFavorites();
    }
  }, [showFavPanel]);

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
              <IconHeartFilled size={24} color="#ff4444" />
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
    fontWeight: 'bold',
    marginBottom: 4,
  },
  favoriteAddress: {
    fontSize: 14,
    color: '#666',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 16,
  },
});