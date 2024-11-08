import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { IconFilter } from '@tabler/icons-react'
import { useSidePanelStore } from '@/states/sidepanel'
import { getPlaceInsights } from '@/api/insights'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { UI_FILTERS } from '@/const/filters'

export default function SidePanel() {
  const places = useMapsLibrary('places')
 
  const { togglePanel, showPanel, selectedPlace } = useSidePanelStore()
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [callFilterAPI, setCallFilterAPI] = useState(false)

  const [imageUri, setImageUri] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedPlace) return

    if (selectedPlace.photosUrl.length <= 0) {
      setImageUri("./assets/images/placeholder-image.jpg")
      return
    }

    setImageUri(selectedPlace.photosUrl[0])
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % selectedPlace.photosUrl.length
      setImageUri(selectedPlace.photosUrl[currentIndex])
    }, 7000)

    return () => clearInterval(interval)
  }, [selectedPlace])

  useEffect(() => {
    if (!callFilterAPI) return

    if (!selectedPlace) return
    const includingFilters = selectedFilters.map(filter => filter.split(' ').join('_').toLowerCase())
    getPlaceInsights(selectedPlace.lat, selectedPlace.lng, includingFilters)

    setCallFilterAPI(false)
  }, [selectedFilters])

  const handleOnFilterPress = async (filter: string) => {
    if (!selectedPlace) return

    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter(f => f !== filter))
    } else {
      setSelectedFilters([...selectedFilters, filter])
      setCallFilterAPI(true)
    }
  }

  return (
    <View style={styles.container}>
      {showPanel && (
        <View style={styles.panel}>
          <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filters}
          contentContainerStyle={{gap: 8}}>
            {UI_FILTERS.map((filter, index) => {
              return (
                <Pressable
                  key={index}
                  onPress={() => handleOnFilterPress(filter)}
                  style={[{
                    padding: 10,
                    borderRadius: 5,
                    backgroundColor: selectedFilters.includes(filter) ? '#4CAF50' : 'white',
                  }]}>
                    <Text style={{ color: selectedFilters.includes(filter) ? 'white' : 'black' }}>
                      {filter}
                    </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {
            selectedPlace && (
              <View style={styles.selectedPlace}>
                <Image source={{ uri: imageUri || selectedPlace.photosUrl[0] }} style={{ width: 400, height: 300, objectFit: 'cover' }} />
                <Text style={styles.placeTitle}>{selectedPlace.address}</Text>
                { selectedPlace.rating !== 0 && <Text>🌟 {selectedPlace.rating}</Text> }
              </View>
            )
          }
        </View>
      )}

      <Pressable style={styles.toggleButton} onPress={() => togglePanel()}>
        <IconFilter size={20} stroke="#000" strokeWidth={2} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: '100%',
    left: 0,
    display: 'flex',
    flexDirection: 'row',
  },
  toggleButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    margin: 10,
    borderRadius: 5,
    width: 48,
    height: 48,
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    backgroundColor: '#ffffff90',
    width: 400,
    height: '100%',
    padding: 20,
  },
  filters: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    flexGrow: 0,
    flexWrap: 'nowrap',
  },
  filterButton: {
    padding: 10,
    borderRadius: 5,
  },
  filterButtonSelected: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  selectedPlace: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f4f4f5',
    overflow: 'hidden',
    borderRadius: 5,
    marginTop: 20,
    paddingBottom: 10,
  },
  placeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
  },
})