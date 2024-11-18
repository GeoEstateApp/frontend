import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://photo-gateway-7fw1yavc.ue.gateway.dev/api';

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

export interface UserData {
  userid: string;
  name: string;
  zipcode: string;
  status: string;
  username: string;
}

export interface UserResponse {
  message: string;
  user?: string;
  alreadyExists?: boolean;
  error?: string;
}

export interface UserProfile {
  userid: string;
  username: string;
  name: string;
}

export interface UserProfileResponse {
  userid?: string;
  username?: string;
  name?: string;
  error?: string;
  message?: string;
}

export const addUser = async (userData: UserData): Promise<UserResponse> => {
  try {
    const { idToken, uid } = await getAuthTokens();
    console.log('Auth tokens:', { hasIdToken: !!idToken, hasUid: !!uid, uid });
    
    if (!idToken || !uid) {
      console.error("Missing tokens - idToken:", !!idToken, "uid:", !!uid);
      throw new Error("Authentication tokens are missing");
    }

    // For Google sign-in, if no username is provided, return USERNAME_REQUIRED
    if (!userData.username) {
      return {
        message: 'Username is required for new users',
        error: 'USERNAME_REQUIRED'
      };
    }

    const url = `${API_URL}/users`;
    console.log('Making request to:', url);
    console.log('Request body:', userData);

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...userData,
        userid: uid // Ensure we're using the uid from AsyncStorage
      }),
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response text:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      return {
        message: 'Invalid response from server',
        error: 'INVALID_RESPONSE'
      };
    }

    if (response.ok) {
      return data;
    }

    // Handle specific error cases
    if (response.status === 400 && data.error === 'USERNAME_TAKEN') {
      return {
        message: 'Username already taken',
        error: 'USERNAME_TAKEN'
      };
    }

    return {
      message: data.error || 'Failed to process the request',
      error: data.error || 'UNKNOWN_ERROR'
    };
  } catch (error: any) {
    console.error("Error adding user:", error);
    return {
      message: error.message,
      error: 'REQUEST_FAILED'
    };
  }
};

export const findUserByUsername = async (username: string): Promise<UserProfileResponse> => {
  try {
    const { idToken, uid } = await getAuthTokens();
    console.log('Auth tokens:', { hasIdToken: !!idToken, hasUid: !!uid, uid });
    
    if (!idToken || !uid) {
      console.error("Missing tokens - idToken:", !!idToken, "uid:", !!uid);
      return {
        error: 'AUTH_MISSING',
        message: 'Authentication tokens are missing'
      };
    }

    const url = `${API_URL}/users/find/${username}`;
    console.log('Making request to:', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response text:', responseText);

    if (response.status === 404) {
      return {
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      return {
        error: 'INVALID_RESPONSE',
        message: 'Invalid response from server'
      };
    }

    if (response.ok) {
      return {
        userid: data.userid,
        username: data.username,
        name: data.name
      };
    }

    return {
      error: data.error || 'UNKNOWN_ERROR',
      message: data.error || 'Failed to find user'
    };
  } catch (error: any) {
    console.error("Error finding user:", error);
    return {
      error: 'REQUEST_FAILED',
      message: error.message
    };
  }
};

export const findUserById = async (userid: string): Promise<UserProfileResponse> => {
  try {
    const { idToken, uid } = await getAuthTokens();
    console.log('Auth tokens:', { hasIdToken: !!idToken, hasUid: !!uid, uid });
    
    if (!idToken || !uid) {
      console.error("Missing tokens - idToken:", !!idToken, "uid:", !!uid);
      return {
        error: 'AUTH_MISSING',
        message: 'Authentication tokens are missing'
      };
    }

    const url = `${API_URL}/users/${userid}`;
    console.log('Making request to:', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response text:', responseText);

    if (response.status === 404) {
      return {
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      return {
        error: 'INVALID_RESPONSE',
        message: 'Invalid response from server'
      };
    }

    if (response.ok) {
      return {
        userid: data.userid,
        username: data.username,
        name: data.name
      };
    }

    return {
      error: data.error || 'UNKNOWN_ERROR',
      message: data.error || 'Failed to find user'
    };
  } catch (error: any) {
    console.error("Error finding user:", error);
    return {
      error: 'REQUEST_FAILED',
      message: error.message
    };
  }
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  try {
    const { idToken, uid } = await getAuthTokens();
    console.log('Auth tokens:', { hasIdToken: !!idToken, hasUid: !!uid, uid });
    
    if (!idToken || !uid) {
      console.error("Missing tokens - idToken:", !!idToken, "uid:", !!uid);
      throw new Error("Authentication tokens are missing");
    }

    const url = `${API_URL}/users/find/${username}`;
    console.log('Checking username availability:', username);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (response.status === 404) {
      return true; // username is available
    }

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Error response:', responseText);
      throw new Error('Failed to check username availability');
    }

    return false; // username is taken
  } catch (error: any) {
    console.error("Error checking username availability:", error);
    throw error;
  }
};
