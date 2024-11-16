import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://photo-gateway-7fw1yavc.ue.gateway.dev/api';

const getAuthTokens = async () => {
  try {
    const idToken = await AsyncStorage.getItem("idToken");
    const uid = await AsyncStorage.getItem("uid");
    const username = await AsyncStorage.getItem("username");
    return { idToken, uid, username };
  } catch (error) {
    console.error("Error retrieving auth tokens:", error);
    throw error;
  }
};

export interface BucketListItem {
  id: number;
  userid: string;
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  created_at: string;
  username?: string;
  user_name?: string;
}

export const getBucketList = async (targetUsername?: string): Promise<BucketListItem[]> => {
  try {
    const { idToken, username } = await getAuthTokens();
    if (!idToken || !username) {
      throw new Error('Authentication required');
    }

    const usernameToFetch = targetUsername || username;
    const url = `${API_URL}/bucket-list/${usernameToFetch}`;
    console.log('Fetching bucket list from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching bucket list:', error);
    throw error;
  }
};

export const addToBucketList = async (place: {
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}): Promise<BucketListItem> => {
  try {
    const { idToken, uid } = await getAuthTokens();
    if (!idToken || !uid) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/bucket-list/add`, {
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
    console.error('Error adding to bucket list:', error);
    throw error;
  }
};

export const removeFromBucketList = async (place_id: string): Promise<void> => {
  try {
    const { idToken, uid } = await getAuthTokens();
    if (!idToken || !uid) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/bucket-list/remove`, {
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
    console.error('Error removing from bucket list:', error);
    throw error;
  }
};
