import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { SearchBox } from '@/components'

/* Import any component to test here */

export default function Component() {
  return (
    <View style={style.container}>
      <SearchBox />
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  }
})