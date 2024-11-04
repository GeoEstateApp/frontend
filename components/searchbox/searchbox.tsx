import { View, StyleSheet, TextInput, Text, Platform } from 'react-native'
import React from 'react'
import { IconSearch } from '@tabler/icons-react'

const suggestions = [
  "New York",
  "Los Angeles",
  "Chicago",
]

export default function SearchBox() {
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  
  return (
    <View style={styles.container}>
      <View style={styles.searchBoxContainer}>
        <IconSearch size={16} stroke="#e4e4e7" />
        <TextInput
          style={styles.input}
          placeholder="Search for any place"
          placeholderTextColor="#666" />
      </View>

      {/* Suggestions */}
      { 
        showSuggestions && <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View> 
      }
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 32,
    display: 'flex',
    flexDirection: 'column',
    width: '30%',
    zIndex: 999,
  },
  searchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: '#f4f4f5',
    borderRadius: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#27272a',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  suggestionsContainer: {
    marginTop: 8,
    marginHorizontal: 16,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  suggestionText: {
    fontSize: 16,
    color: '#27272a',
  },
})
