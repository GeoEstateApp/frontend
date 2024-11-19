import { fetchInsightsPolygonCoordinates, LatLng, PolygonCoordinates } from "./osm"

export interface PlaceInsight {
  lat: number;
  lng: number;
  type: string;
  name: string;
  address: string;
  polygons?: PolygonCoordinates[] | null;
}

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
              "radius": 300
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

    const insights: PlaceInsight[] = []
    const promises = data.placeInsights.map(async (place: any) => {
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

      const { latitude, longitude } = data.location
      const type = data.types.find((t: string) => includingFilters.includes(t)) || "unknown"
      const name = data.displayName.text
      const address = data.formattedAddress

      insights.push({ lat: latitude, lng: longitude, type, name, address })
    })
    
    await Promise.all(promises);
    if (insights.length <= 0) return

    return await fetchInsightsPolygonCoordinates(insights)
  } catch(err) {
    console.log(err)
  }
}

export { getPlaceInsights }