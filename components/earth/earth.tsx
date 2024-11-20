import { Pressable, StyleSheet, View, Text } from 'react-native';
import { Map3D, Map3DCameraProps } from './map-3d';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMapStore } from '@/states/map';
import { fetchPolygonCoordinates, polygonCentroid } from '@/api/osm';
import { useZipcodeInsights } from '@/states/zipcode_insights';
import { useSidePanelStore } from '@/states/sidepanel';
import { IconRotate360 } from '@tabler/icons-react';

const INITIAL_VIEW_PROPS: Map3DCameraProps = {
  center: { lat: 40.75805519944667, lng: -73.98306559396511, altitude: 5000000 }, // Much higher altitude
  range: 2000000,
  heading: 0,
  tilt: 0,
  roll: 0
};

const TARGET_VIEW_PROPS: Map3DCameraProps = {
  center: { lat: 40.75805519944667, lng: -73.98306559396511, altitude: 1500 },
  range: 3500,
  heading: 5,
  tilt: 55,
  roll: 0
};

const TARGET_ALTITUDE = 200; 
const TARGET_ZIPCODE_ALTITUDE = 1200;

export default function Earth() {
  const { selectedPlace, setSelectedPlacePolygonCoordinates, goToPlace } = useMapStore();
  const [viewProps, setViewProps] = useState(INITIAL_VIEW_PROPS);
  const { polygon } = useZipcodeInsights();
  const { selectedRealEstateProperty } = useSidePanelStore()
  const [isRotating, setIsRotating] = useState(false);
  const rotationRef = useRef<number>();

  const smoothTransportToLocation = (newProps: Map3DCameraProps, duration: number = 2000) => {
    const startProps = { ...viewProps };
    let startTime = Date.now();

    // Adjust target latitude and altitude
    const adjustedNewProps = {
      ...newProps,
      center: {
        ...newProps.center,
        lat: newProps.center.lat,
        altitude: newProps.center.altitude
      },
      range: newProps.range, // Remove range multiplier for more accurate targeting
    };

    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Slower easing for smoother transition
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const interpolated = {
        center: {
          lat: startProps.center.lat + (adjustedNewProps.center.lat - startProps.center.lat) * easeProgress,
          lng: startProps.center.lng + (adjustedNewProps.center.lng - startProps.center.lng) * easeProgress,
          altitude: startProps.center.altitude + (adjustedNewProps.center.altitude - startProps.center.altitude) * easeProgress
        },
        range: Math.max(500, Math.min(600, startProps.range + (adjustedNewProps.range - startProps.range) * easeProgress)),
        heading: 0,
        tilt: 45,
        roll: 0
      };

      setViewProps(interpolated);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const startOrbiting = useCallback(() => {
    if (isRotating) {
      setIsRotating(false);
      if (rotationRef.current) {
        cancelAnimationFrame(rotationRef.current);
        rotationRef.current = undefined;
      }
      return;
    }

    setIsRotating(true);
    let lastTime = Date.now();
    let currentHeading = viewProps.heading || 0;

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Rotate 45 degrees per second
      currentHeading = (currentHeading + (deltaTime * 0.045)) % 360;

      setViewProps(prev => ({
        ...prev,
        heading: currentHeading,
      }));

      rotationRef.current = requestAnimationFrame(animate);
    };
    
    rotationRef.current = requestAnimationFrame(animate);
  }, [isRotating, viewProps.heading]);

  // Make sure to clean up the animation when component unmounts or updates
  useEffect(() => {
    if (!isRotating && rotationRef.current) {
      cancelAnimationFrame(rotationRef.current);
      rotationRef.current = undefined;
    }
  }, [isRotating]);

  useEffect(() => {
    return () => {
      if (rotationRef.current) {
        cancelAnimationFrame(rotationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedPlace) return;

    const fetchData = async () => {
      const lat = selectedPlace.geometry?.location?.lat() || 0;
      const lng = selectedPlace.geometry?.location?.lng() || 0;

      const coordinates = await fetchPolygonCoordinates(lat, lng);
      setSelectedPlacePolygonCoordinates(coordinates || []);

      const newProps: Map3DCameraProps = {
        center: { lat, lng, altitude: TARGET_ALTITUDE },
        range: 650, // Increased from 300 to 650
        heading: 0,
        tilt: 45,
        roll: 0
      };

      smoothTransportToLocation(newProps);
    };

    fetchData();
  }, [selectedPlace]);

  useEffect(() => {
    if (!selectedPlace) return;

    const newProps: Map3DCameraProps = {
      center: { lat: selectedPlace.geometry?.location?.lat() || 0, lng: selectedPlace.geometry?.location?.lng() || 0, altitude: TARGET_ALTITUDE },
      range: 650, // Increased from 300 to 650
      heading: 0,
      tilt: 45,
      roll: 0
    };

    smoothTransportToLocation(newProps);
  }, [goToPlace])

  useEffect(() => {
    if (!selectedRealEstateProperty) return;

      const lat = selectedRealEstateProperty.coordinate_lat || 0;
      const lng = selectedRealEstateProperty.coordinate_lon || 0;

      const newProps: Map3DCameraProps = {
        center: { lat, lng, altitude: TARGET_ALTITUDE },
        range: 627, // Increased from 300 to 650
        heading: 0,
        tilt: 45,
        roll: 0
      };

      smoothTransportToLocation(newProps);
  }, [selectedRealEstateProperty]);

  useEffect(() => {
    if (!polygon || !polygon[0]) return

    const { lat, lng } = polygonCentroid(polygon)

    const newProps: Map3DCameraProps = {
      center: { lat, lng, altitude: TARGET_ZIPCODE_ALTITUDE },
      range: 6000,
      heading: 1200,
      tilt: 50,
      roll: 0
    };

    smoothTransportToLocation(newProps);
  }, [polygon])

  useEffect(() => {
    setTimeout(() => {
      smoothTransportToLocation(TARGET_VIEW_PROPS, 6000); 
    }, 100);
  }, []);

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

      <Pressable 
        style={[
          styles.orbitButton,
          isRotating && styles.orbitButtonActive
        ]}
        onPress={startOrbiting}
      >
        <IconRotate360 size={24} color="#fff" />
        <Text style={styles.buttonText}>
          {isRotating ? 'Stop Rotation' : 'Start 360°'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  orbitButton: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -70 }],
    backgroundColor: '#000000cc',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orbitButtonActive: {
    backgroundColor: '#FF4500cc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});