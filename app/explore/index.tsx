import { Earth, SearchBox } from '@/components'
import { APIProvider } from '@vis.gl/react-google-maps'
import { StyleSheet, Text, View } from 'react-native'

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
const GOOGLE_MAP_VERSION = 'alpha'

export default function index() {
  if (!API_KEY) {
    return (
      <View style={styles.container}>
        <Text>Missing Google Maps API Key</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <APIProvider apiKey={API_KEY} version={GOOGLE_MAP_VERSION}>
        <Earth />

        <SearchBox />
      </APIProvider>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
})