import { Earth, SearchBox } from '@/components'
import { StyleSheet, Text, View } from 'react-native'

export default function index() {
  return (
    <View style={styles.container}>
      <Earth />

      <SearchBox />
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