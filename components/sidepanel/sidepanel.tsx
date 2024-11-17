import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { IconFilter } from '@tabler/icons-react'
import { useSidePanelStore } from '@/states/sidepanel'
import { getPlaceInsights, PlaceInsight } from '@/api/insights'
import { SUPPORTED_FILTERS_MAP, UI_FILTERS } from '@/const/filters'
import { useInsightsStore } from '@/states/insights'
import Toast from 'react-native-toast-message'

export default function SidePanel() {
  const { insights, setInsights } = useInsightsStore()
 
  const { selectedPlace, realEstateProperties, setSelectedRealEstateProperty, selectedRealEstateProperty } = useSidePanelStore()
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
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedPlace, selectedPlace?.photosUrl])

  useEffect(() => {
    if (!callFilterAPI) return

    if (!selectedPlace) return
    const includingFilters = selectedFilters.map(filter => filter)

    const fetchInsights = async () => {
      const insights: PlaceInsight[] = await getPlaceInsights(selectedPlace.lat, selectedPlace.lng, includingFilters) || []
      setInsights(insights)
      setCallFilterAPI(false)
    }

    fetchInsights()
  }, [selectedFilters])

  const handleOnFilterPress = async (filter: string) => {
    if (!selectedPlace) {
      Toast.show({
        type: 'error',
        text1: 'No place selected',
        text2: 'Please select a place to see insights',
        autoHide: true,
        visibilityTime: 5000,
        text1Style: { fontSize: 16, fontWeight: 'bold' },
        text2Style: { fontSize: 14 },
      })
      return
    }

    if (selectedFilters.includes(filter)) {
      const map3dElement = document.getElementsByTagName('gmp-map-3d')[0]
      if (!map3dElement) return

      const children = Array.from(map3dElement.children)
      children.forEach(child => {
        const type = child.id.split('-')[0]
        if (type === filter) map3dElement.removeChild(child)
      })

      setSelectedFilters(selectedFilters.filter(f => f !== filter))
      if (insights && insights.length > 0) setInsights(insights.filter(insight => insight.type !== filter))
    } else {
      setSelectedFilters([...selectedFilters, filter])
      setCallFilterAPI(true)
      
      Toast.show({
        type: 'info',
        text1: 'Loading insights...',
        text2: 'Insights will be highlighted on the map',
        autoHide: true,
        visibilityTime: 5000,
        text1Style: { fontSize: 16, fontWeight: 'bold' },
        text2Style: { fontSize: 14 }
      })
    }
  }

  return (
    <View style={styles.container}>
        <View style={styles.panel}>
          {
            selectedPlace && (
              <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={{...styles.filters, flexShrink: 0, minHeight: 40 }}
              contentContainerStyle={{ gap: 8, minHeight: 40 }}>
                {UI_FILTERS.map((filter, index) => {
                  const filterKey = filter.split(' ').join('_').toLowerCase()

                  return (
                    <Pressable
                      key={index}
                      onPress={() => handleOnFilterPress(filterKey)}
                      style={[{
                        padding: 10,
                        borderRadius: 5,
                        backgroundColor: selectedFilters.includes(filterKey) ? `${SUPPORTED_FILTERS_MAP[filterKey as keyof typeof SUPPORTED_FILTERS_MAP]?.fill.substring(0, 7) || 'grey'}` : 'grey',
                      }]}>
                        <Text style={{ color: selectedFilters.includes(filterKey) ? 'white' : 'white' }}>
                          {filter}
                        </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )
          }

          {
            selectedPlace && (
              <View style={styles.selectedPlace}>
                <Image source={{ uri: imageUri || selectedPlace.photosUrl[0] }} style={{ width: 400, height: 250, objectFit: 'cover' }} />
                <Text style={styles.placeTitle}>{selectedPlace.address}</Text>
                { selectedPlace.rating !== 0 && <Text>🌟 {selectedPlace.rating}</Text> }
              </View>
            )
          }

          { realEstateProperties && realEstateProperties.length > 0 && <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 24 }}>Real Estate Properties</Text> }
          <ScrollView showsVerticalScrollIndicator={false}>
            {
              realEstateProperties && realEstateProperties.length > 0 && (
                <View style={{ gap: 8, flexDirection: 'column' }}>
                    {
                      realEstateProperties.map((property, index) => {
                        return <Pressable style={{...styles.realEstateProperty, backgroundColor: selectedRealEstateProperty?.property_id === property.property_id ? '#49A84C' : 'white'}} key={index} onPress={() => setSelectedRealEstateProperty(property)}>
                          <Image source={{ uri: property.img_url }} style={{ width: 100, objectFit: 'cover', borderRadius: 6 }} />
                          <View style={{ gap: 4, display: 'flex', flexDirection: 'column' }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: selectedRealEstateProperty?.property_id === property.property_id ? 'white' : 'black' }}>{property.address_line}</Text>
                            <Text style={{ fontSize: 14, color: selectedRealEstateProperty?.property_id === property.property_id ? 'white' : 'black' }}>Property: {property.property_type.split('_').join(' ').toUpperCase()}</Text>
                            { property.size_sqft && <Text style={{ fontSize: 14, color: selectedRealEstateProperty?.property_id === property.property_id ? 'white' : 'black' }}>Size: {property.size_sqft} ft²</Text> }
                            <Text style={{ fontSize: 14, color: selectedRealEstateProperty?.property_id === property.property_id ? 'white' : 'black' }}>{property.price}</Text>
                            <Text style={{ fontSize: 12, color: selectedRealEstateProperty?.property_id === property.property_id ? 'white' : 'black' }}>{property.status}</Text>
                          </View>
                        </Pressable>
                      })
                    }
                </View>
              )
            }
          </ScrollView>
        </View>
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
    backgroundColor: '#ffffff99',
    width: 400,
    height: '100%',
    padding: 20,
  },
  filters: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'nowrap',
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
  realEstateProperty: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 6,
    cursor: 'pointer'
  }
})