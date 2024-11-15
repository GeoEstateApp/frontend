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

export const addFavorite = async (placeId: string, name: string, address: string, latitude: number, longitude: number) => {
  try {
    const { idToken, uid } = await getAuthTokens();
    console.log('Auth tokens:', { hasIdToken: !!idToken, hasUid: !!uid, uid });
    
    if (!idToken || !uid) {
      console.error("Missing tokens - idToken:", !!idToken, "uid:", !!uid);
      throw new Error("Authentication tokens are missing");
    }

    if (!placeId || !uid) {
      throw new Error("userid and place_id are required");
    }

    const url = 'https://photo-gateway-7fw1yavc.ue.gateway.dev/api/favorites/add';
    console.log('Making request to:', url);
    
    const requestBody = {
      userid: uid,
      place_id: placeId,
      name: name || '',
      address: address || '',
      latitude: latitude || 0,
      longitude: longitude || 0,
    };
    console.log('Request body:', requestBody);
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('Favorite added successfully:', data);
        return data;
      } catch (e) {
        return { success: true }; // Return success even if response isn't JSON
      }
    } else {
      throw new Error(`Error adding favorite: Status ${response.status} - ${response.statusText}. Response: ${responseText}`);
    }
  } catch (error) {
    console.error("Error adding favorite:", error);
    throw error;
  }
};

export const removeFavorite = async (placeId: string) => {
  try {
    const { idToken, uid } = await getAuthTokens();
    console.log('Auth tokens for remove:', { hasIdToken: !!idToken, hasUid: !!uid, uid });
    
    if (!idToken || !uid) {
      console.error("Missing tokens - idToken:", !!idToken, "uid:", !!uid);
      throw new Error("Authentication tokens are missing");
    }

    if (!placeId || !uid) {
      throw new Error("userid and place_id are required for removal");
    }

    const url = 'https://photo-gateway-7fw1yavc.ue.gateway.dev/api/favorites/remove';
    console.log('Making remove request to:', url);
    
    const requestBody = {
      userid: uid,
      place_id: placeId
    };
    console.log('Remove request body:', requestBody);
    
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      mode: 'cors',
      body: JSON.stringify(requestBody)
    });

    console.log('Remove response status:', response.status);
    const responseText = await response.text();
    console.log('Remove response body:', responseText);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('Favorite removed successfully:', data);
        return data;
      } catch (e) {
        return { success: true }; // Return success even if response isn't JSON
      }
    } else {
      throw new Error(`Error removing favorite: Status ${response.status} - ${response.statusText}. Response: ${responseText}`);
    }
  } catch (error) {
    console.error("Error removing favorite:", error);
    throw error;
  }
};
