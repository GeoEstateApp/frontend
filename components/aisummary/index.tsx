import { ActivityIndicator, ScrollView, StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { model } from '@/lib/firebase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useZipcodeInsights } from '@/states/zipcode_insights'
import Toast from 'react-native-toast-message'
import Markdown from 'react-native-markdown-display'
import { IconX } from '@tabler/icons-react'

export default function AICommentsSummary({ onClose, insights }: { onClose: (string: string) => void, insights: string }) {
  const [summary, setSummary] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { zipcode } = useZipcodeInsights()

  useEffect(() => {
    summarizeTheZipcode()
  }, [])

  const summarizeTheZipcode = async () => {
    if (insights !== "") {
      setSummary(insights)
      return
    } 

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
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.panel}>
          <TouchableOpacity style={styles.closeButton} onPress={() => onClose(summary)}>
            <Text style={styles.commentSummaryHeading}>Comments Summary</Text>
            <Text style={styles.closeButtonText}>
              <IconX size={24} />
            </Text>
          </TouchableOpacity>

          {isLoading && <ActivityIndicator style={{flex: 1}} size='large' />}

          {!isLoading && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {summary !== "" && <Markdown>{summary}</Markdown>}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...(Platform.OS === 'web' ? { position: 'fixed' as any } : { position: 'absolute' }),
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    backgroundColor: '#ffffff',
    width: 400,
    maxHeight: '80%',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
    padding: 6,
    marginBottom: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    padding: 4,
  },
  commentSummaryHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  }
})