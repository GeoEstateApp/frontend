import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Map3D, Map3DCameraProps } from './map-3d';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMapStore } from '@/states/map';
import { fetchPolygonCoordinates } from '@/api/osm';

const INITIAL_VIEW_PROPS: Map3DCameraProps = {
  center: { lat: 40.7212803, lng: -74.0004602, altitude: 2500 },
  range: 0,
  heading: 0,
  tilt: 60,
  roll: 0
};

const HOVER_ROTATION_SPEED = 1.00; 
const TARGET_ALTITUDE = 120; 

export default function Earth() {
  const { selectedPlace, setSelectedPlacePolygonCoordinates } = useMapStore();
  const [viewProps, setViewProps] = useState(INITIAL_VIEW_PROPS);
  const [isHovering, setIsHovering] = useState(false);
  const hoverAnimationRef = useRef<number | null>(null);

    // Smooth camera transition
  const smoothTransportToLocation = (newProps: Map3DCameraProps) => {
    const startProps = { ...viewProps };
    let startTime = Date.now();

    const interpolateCameraProps = (
      startProps: Map3DCameraProps,
      endProps: Map3DCameraProps,
      progress: number
    ): Map3DCameraProps => {
      const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
      return {
        center: {
          lat: lerp(startProps.center.lat, endProps.center.lat, progress),
          lng: lerp(startProps.center.lng, endProps.center.lng, progress),
          altitude: lerp(startProps.center.altitude, endProps.center.altitude, progress)
        },
        range: lerp(startProps.range, endProps.range, progress),
        heading: lerp(startProps.heading, endProps.heading, progress),
        tilt: lerp(startProps.tilt, endProps.tilt, progress),
        roll: lerp(startProps.roll, endProps.roll, progress)
      };
    };

    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / 5000, 1);

      const interpolatedProps = interpolateCameraProps(startProps, newProps, progress);
      setViewProps(interpolatedProps);

      if (progress < 1) {
        requestAnimationFrame(animate); 
      }
    };

    requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (!selectedPlace) return;

    const fetchData = async () => {
      const lat = selectedPlace.geometry?.location?.lat() || 0;
      const lng = selectedPlace.geometry?.location?.lng() || 0;

      const coordinates = await fetchPolygonCoordinates(lat, lng);
      setSelectedPlacePolygonCoordinates(coordinates || []);

      const newProps: Map3DCameraProps = {
        center: { lat, lng, altitude: TARGET_ALTITUDE },
        range: 300,
        heading: 300,
        tilt: 50,
        roll: 0
      };

      smoothTransportToLocation(newProps); 
    };

    fetchData();
  }, [selectedPlace]);

   // 360-degree hover rotation
  const rotateCamera = useCallback(() => {
    if (!isHovering) return; 

    setViewProps(prevProps => ({
      ...prevProps,
      heading: (prevProps.heading + HOVER_ROTATION_SPEED) % 360 
    }));

    if (isHovering) {
      hoverAnimationRef.current = requestAnimationFrame(rotateCamera);
    }
  }, [isHovering]);

  const toggleHover = () => {
    setIsHovering(prevState => !prevState);
  };

  useEffect(() => {
    if (isHovering) {
      hoverAnimationRef.current = requestAnimationFrame(rotateCamera);
    } else {
      if (hoverAnimationRef.current) {
        cancelAnimationFrame(hoverAnimationRef.current);
        hoverAnimationRef.current = null; 
      }
    }
  }, [isHovering, rotateCamera]);

  const handleCameraChange = useCallback((props: Map3DCameraProps) => {
    setViewProps(oldProps => ({ ...oldProps, ...props }));
  }, []);

  return (
    <View style={styles.map}>
      <Map3D
        {...viewProps}
        onCameraChange={handleCameraChange}
        defaultLabelsDisabled
      />
      <TouchableOpacity 
        style={[styles.button, isHovering ? styles.buttonStop : styles.buttonStart]}
        onPress={toggleHover}
      >
        <Text style={styles.buttonText}>
          {isHovering ? "Stop 360 View" : "Start 360 View"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  buttonStart: {
    backgroundColor: '#05a659', 
  },
  buttonStop: {
    backgroundColor: '#F44336', 
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
