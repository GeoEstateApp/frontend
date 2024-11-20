import { StyleSheet, View } from 'react-native';
import { Map3D, Map3DCameraProps } from './map-3d';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMapStore } from '@/states/map';
import { fetchPolygonCoordinates, polygonCentroid } from '@/api/osm';
import { useZipcodeInsights } from '@/states/zipcode_insights';
import { useSidePanelStore } from '@/states/sidepanel';

const INITIAL_VIEW_PROPS: Map3DCameraProps = {
  center: { lat: 40.7212803, lng: -74.0004602, altitude: 12000 },
  range: 9000000,
  heading: 0,
  tilt: 45,
  roll: 0
};

const TARGET_VIEW_PROPS: Map3DCameraProps = {
  center: { lat: 40.74832121218563, lng: -73.98572747259036, altitude: 186 },
  range: 5639.068019132246,
  heading: 0,
  tilt: 45,
  roll: 0
};

const TARGET_ALTITUDE = 200;
const TARGET_ZIPCODE_ALTITUDE = 1200;

export default function Earth() {
  const { selectedPlace, setSelectedPlacePolygonCoordinates, goToPlace } = useMapStore();
  const [viewProps, setViewProps] = useState(INITIAL_VIEW_PROPS);
  const { polygon } = useZipcodeInsights();
  const { selectedRealEstateProperty } = useSidePanelStore()

  const smoothTransportToLocation = (newProps: Map3DCameraProps) => {
    const startProps = { ...viewProps };
    let startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / 2000, 1); // Faster transition (2 seconds)
      
      // Smooth easing function
      const easeProgress = progress * (2 - progress);

      const interpolated = {
        center: {
          lat: startProps.center.lat + (newProps.center.lat - startProps.center.lat) * easeProgress,
          lng: startProps.center.lng + (newProps.center.lng - startProps.center.lng) * easeProgress,
          altitude: startProps.center.altitude + (newProps.center.altitude - startProps.center.altitude) * easeProgress
        },
        range: startProps.range + (newProps.range - startProps.range) * easeProgress,
        heading: 0,
        tilt: 45,
        roll: 0     // Keep roll fixed
      };

      setViewProps(interpolated);

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
      range: 300,
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
        range: 300,
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
      smoothTransportToLocation(TARGET_VIEW_PROPS);
    }, 1500);
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
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  }
});