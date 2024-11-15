import { addComment, getComments } from '@/api/comments'; // Adjust the path to your API file
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TestAddCommentButton = () => {
  const handleAddComment = async () => {
    try {
     
      const data = await addComment(
      
      );
      Alert.alert("Add Comment Success", JSON.stringify(data, null, 2));
    } catch (error) {
      Alert.alert("Error adding comment");
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleAddComment}>
      <Text style={styles.buttonText}>Test Add Comment</Text>
    </TouchableOpacity>
  );
};

const TestGetCommentsButton = () => {
  const handleGetComments = async () => {
    try {
     // Replace with actual token retrieval
      const data = await getComments(); // Example userId
      Alert.alert("Get Comments Success", JSON.stringify(data, null, 2));
    } catch (error) {
      Alert.alert("Error fetching comments");
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleGetComments}>
      <Text style={styles.buttonText}>Test Get Comments</Text>
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

const TestButtonsCommentContainer = () => (
  <View style={{ alignItems: 'center' }}>
    <TestAddCommentButton />
    <TestGetCommentsButton />
  </View>
);

export default TestButtonsCommentContainer;
