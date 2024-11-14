import {useMapsLibrary} from '@vis.gl/react-google-maps'
import React, {
  ForwardedRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import {useMap3DCameraEvents} from './use-map-3d-camera-events'
import {useCallbackRef, useDeepCompareEffect} from '@/hooks/utility-hooks'

import './map-3d-types'
import { useMapStore } from '@/states/map'

type LatLngLiteralWithAltitude = google.maps.LatLngLiteral & { altitude: number };

import { convexHull, fetchPolygonCoordinates } from '@/api/osm'
import { getPlaceId } from '@/api/geocoding'
import { useSidePanelStore } from '@/states/sidepanel'
import { useInsightsStore } from '@/states/insights'
import { SUPPORTED_FILTERS_MAP } from '@/const/filters'
import { useZipcodeInsights } from '@/states/zipcode_insights'

export type Map3DProps = google.maps.maps3d.Map3DElementOptions & {
  onCameraChange?: (cameraProps: Map3DCameraProps) => void
}

export type Map3DCameraProps = {
  center: google.maps.LatLngAltitudeLiteral;
  range: number;
  heading: number;
  tilt: number;
  roll: number;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-polygon-3d': any;
      'gmp-marker-3d': any;
    }
  }
}

export const Map3D = forwardRef((props: Map3DProps, forwardedRef: ForwardedRef<google.maps.maps3d.Map3DElement | null>) => {
  const { selectedPlacePolygonCoordinates, setSelectedPlacePolygonCoordinates } = useMapStore()
  const { setSidePanelPlace, setShowPanel } = useSidePanelStore()
  const { insights } = useInsightsStore()
  const { zipcode, polygon, setPolygon } = useZipcodeInsights()

  const [markers, setMarkers] = useState<Array<{id: string, position: LatLngLiteralWithAltitude, pin?: any}>>([])

  useMapsLibrary('maps3d')
  const places = useMapsLibrary('places')
  const maps3d = useMapsLibrary('maps3d')
  const marker = useMapsLibrary('marker')

  const [map3DElement, map3dRef] = useCallbackRef<google.maps.maps3d.Map3DElement>()

  const zipcodePolygonRef = useRef()

  useMap3DCameraEvents(map3DElement, p => {
    if (!props.onCameraChange) return

    props.onCameraChange(p)

    setPolygon(zipcodeCoordinates)
  });

  useEffect(() => {
    if (!map3DElement) return
    if (!polygon) return
    if (!zipcodePolygonRef.current) return

    customElements.whenDefined((zipcodePolygonRef.current as any).localName).then(() => {
      (zipcodePolygonRef.current as any).outerCoordinates = convexHull(zipcodeCoordinates);

      (zipcodePolygonRef.current as any).addEventListener('click', (event: any) => {
        console.log("Polygon Clicked", event)
      })
    })
  }, [zipcodePolygonRef.current, polygon, map3DElement])

  useEffect(() => {
    if (!map3DElement) return;
  
    map3DElement.addEventListener('dblclick', async (event: any) => {
      setSelectedPlacePolygonCoordinates([])

      const { lat, lng, altitude } = event.target.Eg.center

      const coordinates = await fetchPolygonCoordinates(lat, lng)
      if (coordinates && coordinates.length <= 0) return

      setSelectedPlacePolygonCoordinates(coordinates || [])

      const placeId = await getPlaceId(lat, lng)
      
      if (!places) return
      const placesService = new places.PlacesService(document.createElement('div'))
      placesService.getDetails({ placeId }, (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK) return
        if (!place) return

        const address = place.formatted_address || ""
        const lat = place.geometry?.location?.lat() || 0.0
        const lng = place.geometry?.location?.lng() || 0.0
        const photosUrl = Array.isArray(place.photos) ? place.photos.map(photo => photo.getUrl({ maxWidth: 300, maxHeight: 300 })) : []
        const rating = place.rating || 0.0
        const types = place.types || []
        const url = place.url || ""

        setSidePanelPlace({ address, photosUrl, rating, types, lat, lng })
        setShowPanel(true)
      })
    });
  }, [map3DElement]);

  useEffect(() => {
    if (!insights) return
    if (insights.length <= 0) return
    if (!map3DElement) return

    const existingPolygons = map3DElement.querySelectorAll('gmp-polygon-3d')
    const existingTypes = new Set(Array.from(existingPolygons).map(polygon => polygon.id.split('-')[0]))

    if (insights.every(insight => existingTypes.has(insight.type))) return

    insights.forEach((insight, idx) => {
      const polygon = document.createElement('gmp-polygon-3d')
      if (!polygon) return

      const coordinates = insight.polygons || []
      if (coordinates.length <= 0) return

      const { fill, stroke } = SUPPORTED_FILTERS_MAP[insight.type as keyof typeof SUPPORTED_FILTERS_MAP] || SUPPORTED_FILTERS_MAP.manual
      polygon.setAttribute('altitude-mode', 'relative-to-ground')
      polygon.setAttribute('fill-color', fill)
      polygon.setAttribute('stroke-color', stroke)
      polygon.setAttribute('stroke-width', '3')
      polygon.setAttribute('extruded', '')
      polygon.setAttribute('id', `${insight.type}-${idx}`)

      customElements.whenDefined(polygon.localName).then(() => {
        (polygon as any).outerCoordinates = coordinates
        map3DElement.appendChild(polygon)
      })
    })
  }, [insights])

  const [customElementsReady, setCustomElementsReady] = useState(false)
  useEffect(() => {
    Promise.all([
      customElements.whenDefined('gmp-map-3d'),
      customElements.whenDefined('gmp-marker-3d'),
      customElements.whenDefined('gmp-polygon-3d')
    ]).then(() => {
      setCustomElementsReady(true);
    });
  }, []);

  useEffect(() => {
    if (selectedPlacePolygonCoordinates.length <= 0) return

    const polygon = document.querySelector('gmp-polygon-3d')
    if (!polygon) return
    if (!map3DElement) return

    customElements.whenDefined(polygon.localName).then(() => {
      (polygon as any).outerCoordinates = selectedPlacePolygonCoordinates
    })
  }, [selectedPlacePolygonCoordinates])

  const {center, heading, tilt, range, roll, ...map3dOptions} = props

  useDeepCompareEffect(() => {
    if (!map3DElement) return

    // copy all values from map3dOptions to the map3D element itself
    Object.assign(map3DElement, map3dOptions)
  }, [map3DElement, map3dOptions])

  useImperativeHandle<google.maps.maps3d.Map3DElement | null, google.maps.maps3d.Map3DElement | null>(forwardedRef, () => map3DElement, [map3DElement])

  const centerString = useMemo(() => {
    const lat = center?.lat ?? 0.0
    const lng = center?.lng ?? 0.0
    const altitude = center?.altitude ?? 0.0

    return [lat, lng, altitude].join(',')
  }, [center?.lat, center?.lng, center?.altitude])

  useEffect(() => {
    if (!insights || !maps3d || !marker || !map3DElement) {
      setMarkers([]);
      return;
    }

    const newMarkers = insights.map((insight, index) => {
      const pin = new marker.PinElement({
        background: SUPPORTED_FILTERS_MAP[insight.type as keyof typeof SUPPORTED_FILTERS_MAP]?.fill || '#1A73E8',
        borderColor: SUPPORTED_FILTERS_MAP[insight.type as keyof typeof SUPPORTED_FILTERS_MAP]?.stroke || '#1A73E8',
        glyphColor: '#FFFFFF',
        scale: 1.2
      });

      return {
        id: `marker-${insight.type}-${index}`,
        position: {
          lat: insight.lat,
          lng: insight.lng,
          altitude: 75 // default altitude
        },
        pin
      };
    });

    setMarkers(newMarkers);
  }, [insights, maps3d, marker, map3DElement]);

  if (!customElementsReady) return null

  return (
    <gmp-map-3d
      ref={map3dRef}
      center={centerString}
      range={String(props.range)}
      heading={String(props.heading)}
      tilt={String(props.tilt)}
      roll={String(props.roll)}>
      
      <gmp-polygon-3d
        altitude-mode="relative-to-ground" 
        fill-color={SUPPORTED_FILTERS_MAP.manual.fill} 
        stroke-color={SUPPORTED_FILTERS_MAP.manual.stroke} 
        stroke-width="3" 
        extruded>
      </gmp-polygon-3d>

      <gmp-polygon-3d 
        ref={zipcodePolygonRef}
        altitude-mode="relative-to-ground" 
        fill-color={SUPPORTED_FILTERS_MAP.manual.fill} 
        stroke-color={SUPPORTED_FILTERS_MAP.manual.stroke} 
        stroke-width="3" 
        extruded>
      </gmp-polygon-3d>

      {markers.map(marker => (
        <gmp-marker-3d
          key={marker.id}
          position={`${marker.position.lat},${marker.position.lng},${marker.position.altitude}`}
          altitude-mode="relative-to-ground"
          collisionBehavior="OPTIONAL_AND_HIDES_LOWER_PRIORITY"
          extruded=""
          ref={(el: any) => {
            if (el && marker.pin) {
              el.append(marker.pin);
              customElements.whenDefined(el.localName).then(() => {
                el.extruded = true;
                el.altitudeMode = 'RELATIVE_TO_GROUND';
              });
            }
          }}
        />
      ))}

    </gmp-map-3d>
  )
})

const zipcodeAltitudeValue = 100
const zipcodeCoordinates = [
  { "altitude": zipcodeAltitudeValue, "lat": 40.743568340946261, "lng": -73.992318886166558 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.741030960243258, "lng": -73.994164916527083 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.739673401389197, "lng": -73.990945214511953 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.731408854252287, "lng": -73.996974348167711 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.730715240556655, "lng": -73.995562446131657 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.729552248526417, "lng": -73.996572149745887 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.731706121723342, "lng": -74.000954413025354 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.734134852685671, "lng": -73.999187793333434 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.734069744697962, "lng": -73.999653095276756 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.739396052141906, "lng": -74.002789343814612 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.739752663660255, "lng": -74.002523815526416 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.742378003497791, "lng": -74.00880950909432 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.742674373115257, "lng": -74.008748081052858 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.742951557677706, "lng": -74.009634063336563 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.743972534922626, "lng": -74.009452551384712 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.743920479055546, "lng": -74.008902227012982 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.744929441743977, "lng": -74.008727363268548 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.745055351967032, "lng": -74.00956057606966 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.748414065928408, "lng": -74.008946405061423 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.748533487820332, "lng": -74.010086402442397 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.75005116701184, "lng": -74.009541640440617 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.749966841515423, "lng": -74.009213701338354 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.752587143684494, "lng": -74.008270177111342 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.752444033485908, "lng": -74.007712620872738 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.750356904723162, "lng": -74.008486397211598 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.747146795510531, "lng": -74.000848265910392 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.747767914957706, "lng": -74.000398506655785 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.746669602135519, "lng": -73.997760217808292 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.746580923224279, "lng": -73.997551645501957 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.745951324030827, "lng": -73.998008212784072 },
  { "altitude": zipcodeAltitudeValue, "lat": 40.743568340946261, "lng": -73.992318886166558 }
]

