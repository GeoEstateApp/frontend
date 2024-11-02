import { useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

export const useLocalStorage = (key: string, initialValue: any) => {
  const [storedValue, setStoredValue] = useState(async () => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(initialValue))
    } catch (error) { console.log(error) }
  })

  const setValue = async (value: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value))
      setStoredValue(value)
    } catch (error) { console.log(error) }
  }

  return [storedValue, setValue] as [any, (value: any) => Promise<void>]
}