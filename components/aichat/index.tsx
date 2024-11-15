import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { model } from '@/lib/firebase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useZipcodeInsights } from '@/states/zipcode_insights'
import Toast from 'react-native-toast-message'
import Markdown from 'react-native-markdown-display'

export default function AIChat() {
  const [summary, setSummary] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { zipcode } = useZipcodeInsights()

  useEffect(() => {
    summarizeTheZipcode()
  }, [])

  const summarizeTheZipcode = async () => {
    const { idToken, uid } = await getAuthTokens()
    if (idToken === null || uid === null) return
    if (zipcode === null || zipcode === "") {
      Toast.show({
        type: 'error',
        text1: 'Please search a zipcode first.',
        text2: 'You can do this in the Zipcode Insights page.',
        visibilityTime: 5000,
        text1Style: { fontSize: 16 },
        text2Style: { fontSize: 14 },
        autoHide: true
      })
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch(`https://photo-gateway-7fw1yavc.ue.gateway.dev/api/comments/${zipcode}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      if (!response.ok) throw new Error("Network response was not ok")

      const data = await response.json()
      const result = await model.generateContent(JSON.stringify(data))
  
      const aiResponse = result.response
      const text = aiResponse.text()
      setSummary(text)
    } catch (error) {
      console.error("Error fetching API:", error)
    } finally {
      setIsLoading(false)
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
  }

  return (
    <View style={styles.container}>
          <View style={styles.panel}>
            { isLoading && <ActivityIndicator style={{flex: 1}} size='large' /> }

            { !isLoading && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  { summary !== "" && <Markdown>{summary}</Markdown> }
                </ScrollView>
              ) 
            }
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
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    backgroundColor: '#ffffff',
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