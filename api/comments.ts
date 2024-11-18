import AsyncStorage from '@react-native-async-storage/async-storage';

const getAuthTokens = async () => {
  try {
    const idToken = await AsyncStorage.getItem("idToken");
    const uid = await AsyncStorage.getItem("uid");
    const userName= await AsyncStorage.getItem("username");

    return { idToken, uid, userName };
  } catch (error) {
    console.error("Error retrieving auth tokens:", error);
    throw error;
  }
};

export const addComment = async (zipCode: string , newComment:string) => {
  const { idToken, uid, userName } = await getAuthTokens();

  if (!idToken || !uid) {
    throw new Error("Authentication tokens are missing.");
  }

  const url = 'https://photo-gateway-7fw1yavc.ue.gateway.dev/api/comments/add';

  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,  
      },
      body: JSON.stringify({
        userId: uid,
        userName: "Ayesha",
        location: {
          zipCode: zipCode   
        },
        comment: newComment,
        zipCode: "10036"   //user's zipcode
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('API response:', data);
      return data;
    } else {
      throw new Error(`Error: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

export const getComments = async (zipcode: string ) => {
    const { idToken, uid } = await getAuthTokens();
    if (!idToken || !uid) {
      throw new Error("Authentication tokens are missing.");
    }
  
   
    const url = `https://photo-gateway-7fw1yavc.ue.gateway.dev/api/comments/${zipcode}`;
  
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${idToken}`,  
        }
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Get Comments API response:', data);
        return data; 
      } else {
        throw new Error(`Error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }
  };
