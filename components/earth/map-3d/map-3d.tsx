import {useMapsLibrary} from '@vis.gl/react-google-maps'
import React, {
  ForwardedRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState
} from 'react'
import {useMap3DCameraEvents} from './use-map-3d-camera-events'
import {useCallbackRef, useDeepCompareEffect} from '@/hooks/utility-hooks'

import './map-3d-types'
import { useMapStore } from '@/states/map'
import { fetchPolygonCoordinates } from '@/api/osm'
import { getPlaceId } from '@/api/geocoding'
import { useSidePanelStore } from '@/states/sidepanel'
import { useInsightsStore } from '@/states/insights'
import { SUPPORTED_FILTERS_MAP } from '@/const/filters'

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
  const [markers, setMarkers] = useState<Array<{id: string, position: google.maps.LatLngLiteral, pin?: any}>>([])

  useMapsLibrary('maps3d')
  const places = useMapsLibrary('places')
  const maps3d = useMapsLibrary('maps3d')
  const marker = useMapsLibrary('marker')

  const [map3DElement, map3dRef] = useCallbackRef<google.maps.maps3d.Map3DElement>()

  useMap3DCameraEvents(map3DElement, p => {
    if (!props.onCameraChange) return

    props.onCameraChange(p)
  });

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

  useImperativeHandle<
    google.maps.maps3d.Map3DElement | null,
    google.maps.maps3d.Map3DElement | null
  >(forwardedRef, () => map3DElement, [map3DElement])

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
        background: SUPPORTED_FILTERS_MAP[insight.type]?.fill || '#1A73E8',
        borderColor: SUPPORTED_FILTERS_MAP[insight.type]?.stroke || '#1A73E8',
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