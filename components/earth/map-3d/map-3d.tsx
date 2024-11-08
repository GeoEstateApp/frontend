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
import {useCallbackRef, useDeepCompareEffect} from '../../../hooks/utility-hooks'

import './map-3d-types'
import { useMapStore } from '@/states/map'
import { fetchPolygonCoordinates } from '@/api/osm'
import { getPlaceId } from '@/api/geocoding'
import { useSidePanelStore } from '@/states/sidepanel'

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
    }
  }
}

export const Map3D = forwardRef((props: Map3DProps, forwardedRef: ForwardedRef<google.maps.maps3d.Map3DElement | null>) => {
  const { selectedPlacePolygonCoordinates, setSelectedPlacePolygonCoordinates } = useMapStore()
  const { setSidePanelPlace, setShowPanel } = useSidePanelStore()

  useMapsLibrary('maps3d')
  const places = useMapsLibrary('places')

  const [map3DElement, map3dRef] = useCallbackRef<google.maps.maps3d.Map3DElement>()

  useMap3DCameraEvents(map3DElement, p => {
    if (!props.onCameraChange) return

    props.onCameraChange(p)
  });

  useEffect(() => {
    if (!map3DElement) return;
  
    map3DElement.addEventListener('dblclick', async (event: any) => {
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
        const photosUrl = place.photos?.map(photo => photo.getUrl({ maxWidth: 300, maxHeight: 300 })) || []
        const rating = place.rating || 0.0
        const types = place.types || []
        const url = place.url || ""

        setSidePanelPlace({ address, photosUrl, rating, types, lat, lng })
        setShowPanel(true)
      })
    });
  }, [map3DElement]);

  const [customElementsReady, setCustomElementsReady] = useState(false)
  useEffect(() => {
    customElements.whenDefined('gmp-map-3d').then(() => {
      setCustomElementsReady(true)
    })
    customElements.whenDefined('gmp-polygon-3d').then(() => {
      setCustomElementsReady(true)
    })
  }, [])

  useEffect(() => {
    if (selectedPlacePolygonCoordinates.length <= 0) return
    
    const polygon = document.querySelector('gmp-polygon-3d')
    if (!polygon) return

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

  if (!customElementsReady) return null

  return (
    <gmp-map-3d
      ref={map3dRef}
      center={centerString}
      range={String(props.range)}
      heading={String(props.heading)}
      tilt={String(props.tilt)}
      roll={String(props.roll)}>
        <gmp-polygon-3d altitude-mode="relative-to-ground" fill-color="#c7ffb850" stroke-color="#43b524" stroke-width="5" extruded></gmp-polygon-3d>
      </gmp-map-3d>
    )
  }
)