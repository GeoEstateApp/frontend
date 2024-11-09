import { PlaceInsight } from "./insights";

/* 
  TODO: Figure out something when we dont get any details or coordinates from the API 
  (we need to increase the range but we also get additional data. we have to figure it out)
*/
export interface PolygonCoordinates {
  lat: number;
  lng: number;
  altitude: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

const fetchPolygonCoordinates = async (lat: number, lng: number, isInsights?: boolean) => {
  const query = `[out:json];(way["building"](around:${isInsights ? "8" : "1"}, ${lat}, ${lng}););out body;>;out skel qt;`

  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    })

    if (!response.ok) return []

    const data = await response.json()
    if (!data.elements) return []
    if (data.elements.length <= 0) {
      console.log("No elements found... Try increasing the range")
      return []
    }

    const height = Number(data.elements[0].tags.height) || 22
    const postcode = data.elements[0].tags.postcode || ""

    const coordinates = data.elements.map((element: any) => {
      if (element.type === 'node') return { lat: element.lat, lng: element.lon, altitude: height + 2 }
    }).filter((coordinates: any) => coordinates)

    return convexHull(coordinates)
  } catch (err) {
    console.log(err)
  }
}

const fetchInsightsPolygonCoordinates = async (insights: PlaceInsight[]) => {
  const newInsights: PlaceInsight[] = []

  for (const insight of insights) {
    const polygons = await fetchPolygonCoordinates(insight.lat, insight.lng, true)

    newInsights.push({
      lat: insight.lat,
      lng: insight.lng,
      type: insight.type,
      name: insight.name,
      address: insight.address,
      polygons: polygons || []
    })
  }

  return newInsights
}

const convexHull = (coordinates: PolygonCoordinates[]) => {
  const sorted = coordinates.slice().sort((a, b) =>
    a.lat === b.lat ? a.lng - b.lng : a.lat - b.lat
  )

  const lower = [];
  for (const point of sorted) {
    while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop()
    }
    lower.push(point)
  }

  const upper = [];
  for (const point of sorted.reverse()) {
    while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop()
    }
    upper.push(point)
  }

  upper.pop()
  lower.pop()

  return lower.concat(upper)
}

const crossProduct = (o: PolygonCoordinates, a: PolygonCoordinates, b: PolygonCoordinates) => {
  return (a.lat - o.lat) * (b.lng - o.lng) - (a.lng - o.lng) * (b.lat - o.lat)
}

export { fetchPolygonCoordinates, fetchInsightsPolygonCoordinates }