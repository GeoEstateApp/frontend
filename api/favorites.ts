import AsyncStorage from '@react-native-async-storage/async-storage';

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

export const favoritesData = async () => {
  const { idToken, uid } = await getAuthTokens();
  if (!idToken || !uid) {
    throw new Error("Authentication tokens are missing.");
  }

  const url = `https://photo-gateway-7fw1yavc.ue.gateway.dev/api/favorites/${uid}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${idToken}`,  // Use retrieved ID token here
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('External API response:', data);
      return data; // Return data for use elsewhere
    } else {
      throw new Error(`Error: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error fetching external data:", error);
    throw error;
  }
};

export const addFavorite = async (placeId:any, name:any, address:any, latitude:any, longitude:any) => {
  const { idToken, uid } = await getAuthTokens();
  if (!idToken || !uid) {
    throw new Error("Authentication tokens are missing.");
  }

  const url = 'https://photo-gateway-7fw1yavc.ue.gateway.dev/api/favorites/add';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,  // Pass Firebase ID token as Bearer token
      },
      credentials: 'include',
      body: JSON.stringify({
        userid: uid,
        place_id: placeId,
        name: name,
        address: address,
        latitude: latitude,
        longitude: longitude,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Favorite added successfully:', data);
      return data; // Return the response data
    } else {
      throw new Error(`Error adding favorite: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error adding favorite:", error);
    throw error;
  }
};
