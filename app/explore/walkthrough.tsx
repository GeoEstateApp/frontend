import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';

const Walkthrough: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const steps = [
    { key: 'search-bar', text: 'Use the search bar to find places.', x: 100, y: 100 },
    { key: 'sidebar', text: 'Open the side panel to explore additional features.', x: 100, y: 50 },
    { key: 'filters', text: 'Use filters to narrow down your options.', x: 140, y: 30 },
    { key: 'neighborhood', text: 'Explore neighborhoods with detailed views.', x: 50, y: 35 },
    { key: 'zip-comments', text: 'Leave comments for specific zip codes.', x: 50, y: 40 },
    { key: 'wishlist', text: 'Add your favorite places to the wishlist.', x: 50, y: 50 },
    { key: 'sustainability', text: 'Calculate sustainability for properties here.', x: 50, y: 50 },
    { key: 'bucket-list', text: 'Track your bucket list of must-visit places.', x: 50, y: 75 },
    { key: 'sign-in', text: 'Sign in to unlock personalized features.', x: 50, y: 8 },
  ];

  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const { x, y, text } = steps[currentStep];
  const { width, height } = Dimensions.get('window');

  return (
    <Modal transparent visible onRequestClose={onClose} animationType="fade">
      <View style={styles.modalBackground}>
        <View
          style={[
            styles.modalContent,
            { top: Math.min(y + 50, height - 120), left: Math.min(x, width - 260) },
          ]}
        >
          <Text style={styles.text}>{text}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, currentStep === 0 && styles.disabledButton]}
              onPress={handlePrevious}
              disabled={currentStep === 0}
            >
              <Text style={[styles.buttonText, currentStep === 0 && styles.disabledText]}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>{currentStep === steps.length - 1 ? 'Finish' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default Walkthrough;

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'absolute',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
    width: 240,
  },
  text: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#ddd',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#999',
  },
});
