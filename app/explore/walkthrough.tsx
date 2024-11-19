import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Animated } from 'react-native';

const Walkthrough: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const steps = [
    { key: 'search-bar', text: 'Use the search bar to find places.', x: 800, y: 16, width: 480, height: 44, manualX: 570, manualY: 18 },
    { key: 'neighborhood', text: 'Explore neighborhoods with detailed views.', x: 600, y: 200, width: Dimensions.get('window').width, height: Dimensions.get('window').height, manualX: 0, manualY: 0 },
    { key: 'sidebar', text: 'Open the side panel to explore additional features.', x: 100, y: 30, width: 47, height: 190, manualX: 20, manualY: 10 },
    { key: 'filters', text: 'Use filters to narrow down your options.', x: 70, y: 1, width: 45.6, height: 41, manualX: 20, manualY: 10 },
    { key: 'zip-comments', text: 'Leave comments for specific zip codes.', x: 70, y: 40, width: 45.6, height: 41, manualX: 20, manualY: 59 },
    { key: 'wishlist', text: 'Add your favorite places to the wishlist.', x: 70, y: 140, width: 45.6, height: 40, manualX: 20, manualY: 111 },
    { key: 'bucket-list', text: 'Track your bucket list of must-visit places.', x: 70, y: 180, width: 45.6, height: 40, manualX: 20, manualY: 160 },
    { key: 'sustainability', text: 'Calculate sustainability for properties here.', x: 500, y: 15, width: 45, height: 45, manualX: 514, manualY: 18 },
    { key: 'three60-view', text: 'Explore properties virtually with immersive 360 views.', x: 830, y: 450, width: 129.54, height: 41.6, manualX: 701, manualY: 670 },
    { key: 'sign-in', text: 'Sign in to unlock personalized features.', x: 1200, y: 8, width: 42, height: 42, manualX: 1475, manualY: 18 },
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

  const { x, y, text, width, height, manualX, manualY } = steps[currentStep];
  const highlightX = manualX ?? x;
  const highlightY = manualY ?? y;

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  // Close the walkthrough
  const handleClose = () => {
    onClose();
  };

  return (
    <Modal transparent visible onRequestClose={onClose} animationType="fade">
      <View style={styles.modalBackground}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              top: Math.min(y + 50, screenHeight - 120),
              left: Math.min(x, screenWidth - 260),
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>

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
        <View
          style={[
            styles.highlightMask,
            {
              top: highlightY,
              left: highlightX,
              width: width,
              height: height,
              borderRadius: 8,
            },
          ]}
        />
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
    padding: 25,
    backgroundColor: '#000',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
    width: 300,
    zIndex: 10,
    alignItems: 'center',
    borderColor: '#fff',
    borderWidth: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    borderWidth: 1, 
    borderColor: '#fff', 
    borderRadius: 5, 
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  highlightMask: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 255, 0, 0.3)', 
    borderRadius: 8, 
    zIndex: 5, 
  },
});
