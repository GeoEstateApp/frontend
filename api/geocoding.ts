const getPlaceId = async (lat: number, lng: number) => {
  const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!API_KEY) return

  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`)
  
    const responseJson = await response.json()
    if (responseJson.status !== 'OK') return
    if (!responseJson.results || responseJson.results.length <= 0) return

    return responseJson.results[0].place_id
  } catch (error) {
    console.error(error)
  }
}

export { getPlaceId }