import { View, Text, StyleSheet, Button } from 'react-native'
import React, { useState } from 'react'
import { Picker } from '@react-native-picker/picker'
import Slider from '@react-native-community/slider';

interface Prefs {
  minBeds: number,
  minBaths: number,
  rentOrBuy: 'buy' | 'sell',
  priceMin: number,
  priceMax: number,
  age: number,
  homeValuePriority: boolean,
  filterByMedianAge: boolean,
  anchorAddresses: [][],
  propsToReturn: number
}

export default function Suitability() {
  const [currentPage, setCurrentPage] = useState(0)

  // Page One
  const [rentOrBuy, setRentOrBuy] = useState("buy")

  // Page Two
  const [noOfBathrooms, setNoOfBathrooms] = useState(0)
  const [noOfBedrooms, setNoOfBedrooms] = useState(0)

  // Page Three
  const MIN_PRICE = 0
  const MAX_PRICE = 99999999
  const [minPrice, setMinPrice] = useState(MIN_PRICE)
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE)
  const [minPriceLabel, setMinPriceLabel] = useState(minPrice)
  const [maxPriceLabel, setMaxPriceLabel] = useState(maxPrice)

  const prefs: Prefs = {
    minBeds: 0,
    minBaths: 0,
    rentOrBuy: 'buy',
    priceMin: 0,
    priceMax: 0,
    age: 0,
    homeValuePriority: false,
    filterByMedianAge: false,
    anchorAddresses: [],
    propsToReturn: 0
  }
  const nextPage = () => setCurrentPage((prev) => prev + 1)

  const handlePageOne = (answer: string) => {
    setRentOrBuy(answer)
    if (answer === "buy" || answer === "sell") prefs.rentOrBuy = answer

    nextPage()
  }

  const handlePageTwo = () => {
    prefs.minBeds = noOfBedrooms
    prefs.minBaths = noOfBathrooms

    nextPage()
  }

  const handlePageThree = () => {
    prefs.priceMin = minPrice
    prefs.priceMax = maxPrice

    nextPage()

    console.log(prefs)
  }


  return (
    <View style={styles.modal}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8 }}>
        {
          currentPage > 0 && (
            Array.from({ length: 5 }).map((_, idx) => {
              return (
                <View key={idx} style={styles.getStarted}>
                  <Text onPress={() => idx < currentPage && setCurrentPage(idx + 1)} style={{...styles.pageNumber, borderColor: currentPage >= idx + 1 ? '#49a84c' : 'grey', color: currentPage >= idx + 1 ? '#49a84c' : 'grey' }}>{idx + 1}</Text>
                </View>
              )
            })
          )
        }
      </View>

      {
        currentPage == 0 && (
          <View style={styles.getStarted}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Welcome to the Suitability Calculator</Text>
            <Button title="Get Started" onPress={() => setCurrentPage(1)} />
          </View>
        )
      }

      {
        currentPage == 1 && (
          <View style={styles.pageOne}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Are you renting or buying?</Text>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 16 }} >
              <Button title="Renting" onPress={() => handlePageOne('rent')} />
              <Button title="Buying" onPress={() => handlePageOne('buy')} />
            </View>
          </View>
        )
      }

      {
        currentPage == 2 && (
          <View style={styles.pageTwo}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>How many bathroom's and bedrooms do you need?</Text>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
              <Text>Bathrooms:</Text>
              <Picker
                style={{ padding: 8 }}
                selectedValue={noOfBathrooms}
                onValueChange={(itemValue) => setNoOfBathrooms(itemValue)}>
                  {
                    Array.from({ length: 9 }).map((_, idx) => (
                      <Picker.Item key={idx} label={idx.toString()} value={idx} />
                    ))
                  }
              </Picker>

              <Text>Bedrooms:</Text>
              <Picker
                style={{ padding: 8 }}
                selectedValue={noOfBedrooms}
                onValueChange={(itemValue) => setNoOfBedrooms(itemValue)}>
                {
                  Array.from({ length: 9 }).map((_, idx) => (
                    <Picker.Item key={idx} label={idx.toString()} value={idx} />
                  ))
                }
            </Picker>
            </View>
            <Button title="Next" onPress={() => handlePageTwo()} />
          </View>
        )
      }

      {
        currentPage === 3 && (
          <View style={styles.pageThree}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>If buying do you prefer recommendations with high property value outlook</Text>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
              <Text>Minimum Price: {minPrice}</Text>
              <Slider
                style={{width: 200, height: 40}}
                minimumValue={MIN_PRICE}
                maximumValue={MAX_PRICE}
                value={minPrice}
                minimumTrackTintColor="grey"
                maximumTrackTintColor="#000000"
                onValueChange={(value: number) => {
                  setMinPrice(value)
                  setMinPriceLabel(value)
                }}
              />

              <Text>Maximum Price: {maxPrice}</Text>
              <Slider
                style={{width: 200, height: 40}}
                minimumValue={MIN_PRICE}
                maximumValue={MAX_PRICE}
                value={maxPrice}
                minimumTrackTintColor="grey"
                maximumTrackTintColor="#000000"
                onValueChange={(value: number) => {
                  setMaxPrice(value)
                  setMaxPriceLabel(value)
                }}
              />
            </View>
            <Button title="Next" onPress={() => handlePageThree()} />
          </View>
        )
      }
    </View>
  )
}

const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    width: '50%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginVertical: 'auto',
    marginHorizontal: 'auto',
  },
  pageNumber: { 
    fontSize: 18, 
    fontWeight: 'bold',
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,  
    width: 40,  
    textAlign: 'center',  
    textAlignVertical: 'center', 
    color: 'grey', 
    borderRadius: 5000,
    padding: 8, 
    cursor: 'pointer',
    userSelect: 'none',
    borderWidth: 1, 
    borderColor: 'grey'
  },
  getStarted: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    gap: 16
  },
  pageOne: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 16
  },
  pageTwo: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 16
  },
  pageThree: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 16
  }
});