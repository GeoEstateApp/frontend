import { fetchMultiplePolygonCoordinates, LatLng } from "./osm"

const getPlaceInsights = async (lat: number, lng: number, includingFilters: string[]) => {
  try {
    const response = await fetch(`https://areainsights.googleapis.com/v1:computeInsights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': `${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
      },
      body: JSON.stringify({
        "insights": ["INSIGHT_COUNT", "INSIGHT_PLACES"],
        "filter": {
          "location_filter": {
            "circle": {
              "lat_lng": { "latitude": lat, "longitude": lng },
              "radius": 200
            }
          },
          "type_filter": { "included_types": includingFilters }
        }
      })
    })

    if (!response.ok) {
      console.log(response)
      return
    }

    const data = await response.json()
    if (!data.placeInsights) return []

    if (data.placeInsights.length <= 0) return

    const coordinatesToSearch: LatLng[] = []
    data.placeInsights.forEach(async (place: any) => {
      const placeId = place.place.replace("places/", "")

      const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': `${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`,
          'X-Goog-FieldMask': "displayName,formattedAddress,location,types"
        }
      })

      if (!response.ok) return

      const data = await response.json()
      if (!data) return

      console.log(data)

      const { latitude, longitude } = data.location
      const type = data.types[0]
      const name = data.displayName.text
      const address = data.formattedAddress

      coordinatesToSearch.push({ lat: latitude, lng: longitude })
    })

    if (coordinatesToSearch.length <= 0) return

    await fetchMultiplePolygonCoordinates(coordinatesToSearch)
  } catch(err) {
    console.log(err)
  }
}

export { getPlaceInsights }