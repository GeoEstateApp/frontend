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
  let radius = isInsights ? 8 : 1;
  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    const query = `[out:json];(way["building"](around:${radius}, ${lat}, ${lng}););out body;>;out skel qt;`;

    try {
      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
        }
      );

      if (!response.ok) {
        console.log("API response not OK. Exiting.");
        return [];
      }

      const data = await response.json();
      if (!data.elements || data.elements.length <= 0) {
        console.log(`No elements found. Attempt ${attempt + 1} failed. Increasing radius...`);
        radius += isInsights ? 8 : attempt >= 1 ? 4 : 8;
        attempt++;
        continue;
      }

      // Filter for the first `way` element
      const wayElement = data.elements.find((element: any) => element.type === 'way');
      if (!wayElement) {
        console.log("No 'way' type elements found.");
        radius += isInsights ? 8 : attempt >= 1 ? 4 : 8;
        attempt++;
        continue;
      }

      const height = Number(wayElement.tags?.height) || 22;
      const postcode = wayElement.tags?.postcode || "";

      const coordinates = data.elements
        .filter((element: any) => element.type === 'node')
        .map((element: any) => ({
          lat: element.lat,
          lng: element.lon,
          altitude: height + 2
        }));

      return convexHull(coordinates);
    } catch (err) {
      console.log("Error fetching data:", err);
    }
  }

  console.log("Max attempts reached. Returning empty array.");
  return [];
};


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

export const convexHull = (coordinates: PolygonCoordinates[]) => {
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

export const polygonCentroid = (coordinates: PolygonCoordinates[]) => {
  let signedArea = 0;
  let centroidX = 0;
  let centroidY = 0;

  const n = coordinates.length;

  for (let i = 0; i < n; i++) {
    const { lat: x0, lng: y0 } = coordinates[i];
    const { lat: x1, lng: y1 } = coordinates[(i + 1) % n]; // Wrap around to the first vertex

    const a = x0 * y1 - x1 * y0;
    signedArea += a;
    centroidX += (x0 + x1) * a;
    centroidY += (y0 + y1) * a;
  }

  signedArea *= 0.5;
  centroidX /= 6 * signedArea;
  centroidY /= 6 * signedArea;

  return { lat: centroidX, lng: centroidY };
}

export { fetchPolygonCoordinates, fetchInsightsPolygonCoordinates }