import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Region } from '../types'
import 'leaflet/dist/leaflet.css'
import './InteractiveMap.css'

const BRAZIL_CENTER: [number, number] = [-14.2350, -51.9253]
const BRAZIL_ZOOM = 4
const REGION_ZOOM = 9

function fixLeafletIcons() {
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

fixLeafletIcons()

const markerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface InteractiveMapProps {
  selectedRegion: Region | null
  onMapClick: (latlng: { lat: number; lng: number }) => void
}

function MapClickHandler({ onClick }: { onClick: (latlng: { lat: number; lng: number }) => void }) {
  const ref = useRef(onClick)
  ref.current = onClick

  useMapEvents({
    click: (e) => {
      ref.current({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function MapFlyTo({ region }: { region: Region | null }) {
  const map = useMap()
  const initial = useRef(true)

  useEffect(() => {
    if (initial.current) {
      initial.current = false
      return
    }
    if (region) {
      map.flyTo(
        [Number(region.latitude), Number(region.longitude)],
        REGION_ZOOM,
        { duration: 0.8 }
      )
    }
  }, [map, region])

  return null
}

export function InteractiveMap({ selectedRegion, onMapClick }: InteractiveMapProps) {
  const center = selectedRegion
    ? [Number(selectedRegion.latitude), Number(selectedRegion.longitude)] as [number, number]
    : BRAZIL_CENTER
  const zoom = selectedRegion ? REGION_ZOOM : BRAZIL_ZOOM

  return (
    <div className="interactive-map">
      <MapContainer
        center={center}
        zoom={zoom}
        className="interactive-map__container"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onClick={onMapClick} />

        {selectedRegion && (
          <Marker
            key={selectedRegion.id}
            position={[Number(selectedRegion.latitude), Number(selectedRegion.longitude)]}
            icon={markerIcon}
          >
            <Popup>
              <strong>{selectedRegion.name}</strong>
              <br />
              {selectedRegion.state} &mdash; {selectedRegion.latitude}, {selectedRegion.longitude}
            </Popup>
          </Marker>
        )}

        <MapFlyTo region={selectedRegion} />
      </MapContainer>
    </div>
  )
}
