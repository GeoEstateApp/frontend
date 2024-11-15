import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useDebouncedEffect } from '@/hooks/utility-hooks'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useZipcodeInsights } from '@/states/zipcode_insights'
import { convexHull, PolygonCoordinates } from '@/api/osm'
import Toast from 'react-native-toast-message'

interface ZipPanelProps {
  isZipcodePanelOpen: boolean
}

interface ZipcodeData {
  zipcode: string
  name: string
}

export default function ZipPanel({ isZipcodePanelOpen }: ZipPanelProps) {
  const [zipcodes, setZipcodes] = useState<ZipcodeData[]>([])
  const [searchingZipcodeText, setSearchingZipcodeText] = useState<string>("")
  const [zipcodeList, setZipcodeList] = useState<ZipcodeData[]>(zipcodes)

  const { zipcode, setPolygon, setZipcode, zipcodeInsights, setPolygons } = useZipcodeInsights()

  const handleZipcodeFilter = (text: string) => {
    const filteredZipcodes = zipcodes.filter((zipcodeData) => zipcodeData.zipcode.includes(text) || zipcodeData.name.includes(text))
    setZipcodeList(filteredZipcodes)
  }
  
  useDebouncedEffect(() => {
    if (searchingZipcodeText === "") {
      setZipcodeList(zipcodes)
      return
    }

    handleZipcodeFilter(searchingZipcodeText)
  }, 300, [searchingZipcodeText])

  useEffect(() => {
    if (zipcode === '') return

    handleZipcodeChange()
  }, [zipcode])

  useEffect(() => {
    if (zipcodes.length === 0) getAllZipcodes()

    // renderMultipleZipcodes()
  }, [])

  const getAllZipcodes = async () => {
    Toast.show({
      type: 'info',
      text1: 'Fetching zipcodes!',
      text2: 'Please wait zipcodes are loading...',
      visibilityTime: 5000,
      autoHide: true,
      topOffset: 20,
      text1Style: { fontSize: 16, fontWeight: 'bold' },
      text2Style: { fontSize: 14 },
    })

    const { idToken, uid } = await getAuthTokens()
    if (!idToken || !uid) {
      console.log("No auth tokens found.")
      return
    }

    try {
      const response = await fetch(`https://photo-gateway-7fw1yavc.ue.gateway.dev/api/locations`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      })

      if (!response.ok) throw new Error("Failed to fetch zipcode data.")

      const data = await response.json()

      setZipcodes(data.map((item: any) => ({ zipcode: item.zipcode, name: item.name })))
      setZipcodeList(data.map((item: any) => ({ zipcode: item.zipcode, name: item.name })))

      Toast.hide()
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  // const renderMultipleZipcodes = async () => {
  //   const { idToken, uid } = await getAuthTokens()
  //   if (!idToken || !uid) {
  //     console.log("No auth tokens found.")
  //     return
  //   }

  //   const polygons: PolygonCoordinates[] = []
  //   const promises = zipcodes.map(async (zipcodeData) => {
  //     try {
  //       const response = await fetch(`https://photo-gateway-7fw1yavc.ue.gateway.dev/api/locations/${zipcodeData.zipcode}`, {
  //         method: 'GET',
  //         credentials: 'include',
  //         headers: {
  //           Authorization: `Bearer ${idToken}`
  //         }
  //       })

  //       if (!response.ok) throw new Error("Failed to fetch zipcode data.")

  //       const data = await response.json()
  //       const coordinates = data[0].geometry.coordinates[0].map((coordinate: number[]) => ({ lat: coordinate[1], lng: coordinate[0], altitude: 150 }))
  //       polygons.push((convexHull(coordinates) as any))
  //     } catch (error) {
  //   	  console.error("Error fetching data:", error)
  //       return null
  //     }
  //   })

  //   await Promise.all(promises)
  //   setPolygons((polygons as any))
  // }

  const handleZipcodeChange = async () => {
    const { idToken, uid } = await getAuthTokens()
    if (!idToken || !uid) {
      console.log("No auth tokens found.")
      return
    }

    try {
      Toast.show({
        type: 'info',
        text1: 'Fetching zipcode!',
        text2: 'Please wait zipcode is loading...',
        visibilityTime: 5000,
        autoHide: true,
        topOffset: 20,
        text1Style: { fontSize: 16, fontWeight: 'bold' },
        text2Style: { fontSize: 14 },
      })

      const response = await fetch(`https://photo-gateway-7fw1yavc.ue.gateway.dev/api/locations/${zipcode}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch zipcode data.") 

      const data = await response.json()

      const coordinates = data[0].geometry.coordinates[0].map((coordinate: number[]) => ({ lat: coordinate[1], lng: coordinate[0], altitude: 150 }))
      setPolygon(convexHull(coordinates))

      Toast.hide()
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const getAuthTokens = async () => {
    try {
      const idToken = await AsyncStorage.getItem("idToken");
      const uid = await AsyncStorage.getItem("uid");
      return { idToken, uid };
    } catch (error) {
      console.error("Error retrieving auth tokens:", error);
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      {
        isZipcodePanelOpen && (
          <View style={styles.panel}>
            <TextInput 
              style={styles.input} 
              value={searchingZipcodeText}
              placeholder="Enter zipcode to search"
              onChangeText={(text) => setSearchingZipcodeText(text)} />

            <ScrollView contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
              {
                zipcodeList.map((zip, idx) => {
                  return (
                    <Pressable key={idx} style={{...styles.zipcodeButton, backgroundColor: zip.zipcode === zipcode ? '#e0e0e0' : '#fff', gap: 20 }} onPress={() => setZipcode(zip.zipcode)}>
                      <View>
                        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{zip.zipcode}</Text>
                        <Text>{zip.name}</Text>
                      </View>

                      {
                        zip.zipcode === zipcode && (
                          <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Zipcode Insights:</Text>
                            <Text>Population: {zipcodeInsights.population}</Text>
                            <Text>Median Age: {zipcodeInsights.medianAge}</Text>
                            <Text>Vacancies [Rent]: {zipcodeInsights.vacanciesForRentPercent}</Text>
                            <Text>Vacancies [Sale]: {zipcodeInsights.vacanciesForSalePercent}</Text>
                            <Text>Home Forecast: {zipcodeInsights.homeValueForecast}</Text>
                          </View>
                        )
                      }
                    </Pressable>
                  )
                })
              }
            </ScrollView>
          </View>
        )
      }
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
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    backgroundColor: '#ffffff99',
    width: 400,
    height: '100%',
    padding: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    color: '#27272a',
  },
  zipcodeButton: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
  },
})

const zipcodeAltitudeValue = 150
const dummyZipcodePolygon = [
  { "altitude": zipcodeAltitudeValue, "lat": 40.743568340946261, "lng": -73.992318886166558 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.741030960243258, "lng": -73.994164916527083 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.739673401389197, "lng": -73.990945214511953 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.731408854252287, "lng": -73.996974348167711 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.730715240556655, "lng": -73.995562446131657 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.729552248526417, "lng": -73.996572149745887 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.731706121723342, "lng": -74.000954413025354 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.734134852685671, "lng": -73.999187793333434 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.734069744697962, "lng": -73.999653095276756 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.739396052141906, "lng": -74.002789343814612 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.739752663660255, "lng": -74.002523815526416 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.742378003497791, "lng": -74.00880950909432 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.742674373115257, "lng": -74.008748081052858 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.742951557677706, "lng": -74.009634063336563 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.743972534922626, "lng": -74.009452551384712 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.743920479055546, "lng": -74.008902227012982 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.744929441743977, "lng": -74.008727363268548 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.745055351967032, "lng": -74.00956057606966 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.748414065928408, "lng": -74.008946405061423 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.748533487820332, "lng": -74.010086402442397 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.75005116701184, "lng": -74.009541640440617 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.749966841515423, "lng": -74.009213701338354 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.752587143684494, "lng": -74.008270177111342 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.752444033485908, "lng": -74.007712620872738 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.750356904723162, "lng": -74.008486397211598 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.747146795510531, "lng": -74.000848265910392 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.747767914957706, "lng": -74.000398506655785 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.746669602135519, "lng": -73.997760217808292 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.746580923224279, "lng": -73.997551645501957 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.745951324030827, "lng": -73.998008212784072 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.743568340946261, "lng": -73.992318886166558 }
]