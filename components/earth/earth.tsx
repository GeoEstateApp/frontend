import { StyleSheet, Text, View } from 'react-native'
import { Map3D, Map3DCameraProps } from './map-3d';
import { useCallback, useState } from 'react';
import { APIProvider, MapMouseEvent } from '@vis.gl/react-google-maps';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
const GOOGLE_MAP_VERSION = 'alpha'
const INITIAL_VIEW_PROPS: Map3DCameraProps = {
  center: { lat: 40.713754032181356, lng: -74.00807587502253, altitude: 1300 },
  range: 5000,
  heading: 61,
  tilt: 69,
  roll: 0
}

export default function Earth() {
  const [viewProps, setViewProps] = useState(INITIAL_VIEW_PROPS)
  
  const handleCameraChange = useCallback((props: Map3DCameraProps) => {
    setViewProps(oldProps => ({...oldProps, ...props}))
  }, [])

  const handleMapClick = useCallback((ev: MapMouseEvent) => {
    if (!ev.detail.latLng) return

    const {lat, lng} = ev.detail.latLng
    setViewProps(p => ({...p, center: {lat, lng, altitude: 0}}))
  }, [])

  if (API_KEY) {
    return (
      <View style={styles.map}>
        <APIProvider apiKey={API_KEY} version={GOOGLE_MAP_VERSION}>
          <Map3D
            {...viewProps}
            onCameraChange={handleCameraChange}
            defaultLabelsDisabled
          />
        </APIProvider>
      </View>
    )
  }

  return <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <Text>Missing Google Maps API Key</Text>
  </View>
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  }
})