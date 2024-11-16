import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { IconHeart, IconHeartFilled } from '@tabler/icons-react'
import { favoritesData, removeFavorite } from '@/api/favorites'
import Toast from 'react-native-toast-message'
import { useFavoritesPanelStore } from '@/states/favoritespanel'

export default function FavoritesPanel() {
  const { showPanel } = useFavoritesPanelStore()
  const [favorites, setFavorites] = useState<any[]>([])

  // Load user's favorites
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const userFavorites = await favoritesData();
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
  }, []);

  if (!showPanel) return null;

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Favorites</Text>
      <ScrollView style={styles.favoritesList}>
        {favorites.map((favorite, index) => (
          <Pressable
            key={index}
            style={styles.favoriteItem}
            onPress={() => {
              // TODO: Implement selecting a favorite place
              Toast.show({
                type: 'info',
                text1: 'Selected Favorite',
                text2: favorite.name,
                visibilityTime: 2000,
              });
            }}
          >
            <View style={styles.favoriteContent}>
              <Text style={styles.favoriteName}>{favorite.name || 'Unnamed Place'}</Text>
              <Text style={styles.favoriteAddress}>{favorite.address}</Text>
            </View>
            <Pressable
              style={styles.removeFavoriteButton}
              onPress={async (e) => {
                e.stopPropagation();
                try {
                  await removeFavorite(favorite.place_id);
                  const updatedFavorites = await favoritesData();
                  setFavorites(updatedFavorites);
                  Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Removed from favorites',
                    visibilityTime: 2000,
                  });
                } catch (error) {
                  Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Could not remove favorite',
                    visibilityTime: 3000,
                  });
                }
              }}
            >
              <IconHeartFilled size={20} color="#ff4444" />
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    backgroundColor: '#ffffff90',
    width: 400,
    height: '100%',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  favoritesList: {
    flex: 1,
  },
  favoriteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  favoriteContent: {
    flex: 1,
    marginRight: 10,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  favoriteAddress: {
    fontSize: 14,
    color: '#666',
  },
  removeFavoriteButton: {
    padding: 8,
  },
})