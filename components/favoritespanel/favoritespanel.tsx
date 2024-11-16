import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { IconHeart, IconHeartFilled } from '@tabler/icons-react'
import { getBucketList, BucketListItem, removeFromBucketList } from '@/api/bucketlist'
import Toast from 'react-native-toast-message'
import { useFavoritesPanelStore } from '@/states/favoritespanel'

export default function FavoritesPanel() {
  const { showPanel } = useFavoritesPanelStore()
  const [favorites, setFavorites] = useState<BucketListItem[]>([])

  // Load user's favorites
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const userFavorites = await getBucketList();
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
      <Text style={styles.title}>My Bucket List</Text>
      <ScrollView style={styles.favoritesList}>
        {favorites.length === 0 ? (
          <Text style={styles.emptyMessage}>Your bucket list is empty. Add places you want to visit!</Text>
        ) : (
          favorites.map((favorite, index) => (
            <Pressable
              key={index}
              style={styles.favoriteItem}
              onPress={() => {
                // TODO: Implement selecting a favorite place
                Toast.show({
                  type: 'info',
                  text1: 'Selected Place',
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
                    await removeFromBucketList(favorite.place_id);
                    const updatedFavorites = await getBucketList();
                    setFavorites(updatedFavorites);
                    Toast.show({
                      type: 'success',
                      text1: 'Success',
                      text2: 'Removed from bucket list',
                      visibilityTime: 2000,
                    });
                  } catch (error) {
                    Toast.show({
                      type: 'error',
                      text1: 'Error',
                      text2: 'Could not remove from bucket list',
                      visibilityTime: 3000,
                    });
                  }
                }}
              >
                <IconHeartFilled size={20} color="#ff4444" />
              </Pressable>
            </Pressable>
          ))
        )}
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
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  favoriteContent: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '500',
  },
  favoriteAddress: {
    fontSize: 14,
    color: '#666',
  },
  removeFavoriteButton: {
    padding: 8,
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
});