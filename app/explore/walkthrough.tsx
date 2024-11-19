import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Animated } from 'react-native';

const Walkthrough: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const steps = [
    { key: 'search-bar', text: 'Use the search bar to find places.', x: 800, y: 10 },
    { key: 'neighborhood', text: 'Explore neighborhoods with detailed views.', x: 20, y: 15 },
    { key: 'sidebar', text: 'Open the side panel to explore additional features.', x: 100, y: 30 },
    { key: 'filters', text: 'Use filters to narrow down your options.', x: 50, y: 1 },
    { key: 'zip-comments', text: 'Leave comments for specific zip codes.', x: 50, y: 40 },
    { key: 'ai-summary', text: 'Get AI-powered surroundings insights.', x: 50, y: 80 },
    { key: 'wishlist', text: 'Add your favorite places to the wishlist.', x: 50, y: 140 },
    { key: 'bucket-list', text: 'Track your bucket list of must-visit places.', x: 50, y: 180 },
    { key: 'sustainability', text: 'Calculate sustainability for properties here.', x: 640, y: 5 },
    { key: 'three60-view', text: 'Explore properties virtually with immersive 360 views.', x: 830, y: 490 },
    { key: 'sign-in', text: 'Sign in to unlock personalized features.', x: 1200, y: 8 },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = new Animated.Value(0); 

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

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  return (
    <Modal transparent visible onRequestClose={onClose} animationType="fade">
      <View style={styles.modalBackground}>
        <Animated.View
          style={[ 
            styles.modalContent,
            { top: Math.min(y + 50, height - 120), left: Math.min(x, width - 260), opacity: fadeAnim },
          ]}
        >
          <Text style={styles.text}>{text}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.prevButton, currentStep === 0 && styles.disabledButton]}
              onPress={handlePrevious}
              disabled={currentStep === 0}
            >
              <Text style={[styles.buttonText, currentStep === 0 && styles.disabledText]}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.stepIndicatorContainer}>
            {steps.map((step, index) => (
              <View
                key={step.key}
                style={[ 
                  styles.stepIndicator,
                  index === currentStep && styles.activeStepIndicator,
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default Walkthrough;

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'absolute',
    padding: 20,
    backgroundColor: '#000',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
    width: 280,
    zIndex: 10,
    alignItems: 'center',
    borderColor: '#fff',
    borderWidth: 1,
  },
  text: {
    fontSize: 18,
    color: '#fff', 
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20, 
  },
  prevButton: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    borderColor: '#ddd', 
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 3,
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  disabledText: {
    color: '#999',
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 15, 
    width: '100%',
  },
  stepIndicator: {
    width: 6, 
    height: 6, 
    backgroundColor: '#ccc',
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeStepIndicator: {
    backgroundColor: '#4CAF50',
  },
});
