import { favoritesData, addFavorite } from '@/api/favorites'; // Adjust the path to your API file
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TestButtonProps {
  label?: string;
}

const TestButton: React.FC<TestButtonProps> = ({ label = "Test Get Favorites" }) => {
  const handlePress = async () => {
    try {
      const data = await favoritesData();
      Alert.alert("API Call Success", JSON.stringify(data, null, 2));
    } catch (error) {
      Alert.alert("Something went wrong");
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
};

const TestAddFavoriteButton: React.FC = () => {
  const handleAddFavorite = async () => {
    try {
      const data = await addFavorite(
         // Example userId
        "place_123", // Example placeId
        "Central Park", // Example name
        "New York, NY", // Example address
        40.785091, // Example latitude
        -73.968285 // Example longitude
      );
      Alert.alert("Add Favorite Success", JSON.stringify(data, null, 2));
    } catch (error) {
      Alert.alert("Something went wrong with Add Favorite");
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleAddFavorite}>
      <Text style={styles.buttonText}>Test Add Favorite</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    margin: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const TestButtonsContainer: React.FC = () => (
  <View style={{ alignItems: 'center' }}>
    <TestButton label="Test Get Favorites" />
    <TestAddFavoriteButton />
  </View>
);

export default TestButtonsContainer;
