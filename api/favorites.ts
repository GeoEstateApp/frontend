import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://photo-gateway-7fw1yavc.ue.gateway.dev/api';

export interface FavoriteItem {
  id: number;
  userid: string;
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

const getAuthTokens = async () => {
  try {
    const idToken = await AsyncStorage.getItem("idToken");
    const uid = await AsyncStorage.getItem("uid");
    return { idToken, uid };
  } catch (error) {
    console.error("Error retrieving auth tokens:", error);
    throw error;
  }
};

export const getFavorites = async (): Promise<FavoriteItem[]> => {
  try {
    const { idToken, uid } = await getAuthTokens();
    if (!idToken || !uid) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/favorites/${uid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching favorites:', error);
    throw error;
  }
};

export const addFavorite = async (place: {
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}): Promise<FavoriteItem> => {
  try {
    const { idToken, uid } = await getAuthTokens();
    if (!idToken || !uid) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/favorites/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        userid: uid,
        ...place,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
};

export const removeFavorite = async (place_id: string): Promise<void> => {
  try {
    const { idToken, uid } = await getAuthTokens();
    if (!idToken || !uid) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/favorites/remove`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        userid: uid,
        place_id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
};
