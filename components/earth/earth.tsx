import { StyleSheet, Text, View } from 'react-native'
import { Map3D, Map3DCameraProps } from './map-3d';
import { useCallback, useEffect, useState } from 'react';
import { useMapStore } from '@/states/map';
import { fetchPolygonCoordinates } from '@/api/osm';

const INITIAL_VIEW_PROPS: Map3DCameraProps = {
  center: { lat: 40.7212803, lng: -74.0004602, altitude: 2500 },
  range: 0,
  heading: 0,
  tilt: 60,
  roll: 0
}

export default function Earth() {
  const { selectedPlace, setSelectedPlacePolygonCoordinates } = useMapStore()

  const [viewProps, setViewProps] = useState(INITIAL_VIEW_PROPS)

  useEffect(() => {
    if (!selectedPlace) return

    const fetchData = async () => {
      const lat = selectedPlace.geometry?.location?.lat() || 0
      const lng = selectedPlace.geometry?.location?.lng() || 0

      const coordinates = await fetchPolygonCoordinates(lat, lng)
      setSelectedPlacePolygonCoordinates(coordinates || [])

      setViewProps(p => ({...p, center: { lat, lng, altitude: 15 }}))
    }

    fetchData()
  }, [selectedPlace])
  
  const handleCameraChange = useCallback((props: Map3DCameraProps) => {
    setViewProps(oldProps => ({...oldProps, ...props}))
  }, [])

    return (
      <View style={styles.map}>
        <Map3D
          {...viewProps}
          onCameraChange={handleCameraChange}
          defaultLabelsDisabled
        />
      </View>
    )
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  }
})