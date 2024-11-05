export interface PolygonCoordinates {
  lat: number;
  lng: number;
  altitude: number;
}

export const fetchPolygonCoordinates = async (lat: number, lng: number) => {
  const query = `[out:json];(way["building"](around:1, ${lat}, ${lng}););out body;>;out skel qt;`

  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    })

    if (!response.ok) return []

    const data = await response.json()
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

// Convex Hull implementation
const convexHull = (coordinates: PolygonCoordinates[]) => {
  // Sort points by latitude, then by longitude
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

  // Remove the last point of each half because it's repeated at the beginning of the other half
  upper.pop()
  lower.pop()

  return lower.concat(upper)
}

const crossProduct = (o: PolygonCoordinates, a: PolygonCoordinates, b: PolygonCoordinates) => {
  return (a.lat - o.lat) * (b.lng - o.lng) - (a.lng - o.lng) * (b.lat - o.lat)
}