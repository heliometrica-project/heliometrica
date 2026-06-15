import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { SelectedLocation } from '../types'
import 'leaflet/dist/leaflet.css'
import './InteractiveMap.css'

const BRAZIL_CENTER: [number, number] = [-14.2350, -51.9253]
const INITIAL_ZOOM = 5

const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png'
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png'
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

const markerIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface InteractiveMapProps {
  selectedLocation: SelectedLocation | null
  onMapClick: (latlng: { lat: number; lng: number }) => void
}

function MapClickHandler({ onClick }: { onClick: (latlng: { lat: number; lng: number }) => void }) {
  const ref = useRef(onClick)
  ref.current = onClick
  useMapEvents({
    click: (e) => ref.current({ lat: e.latlng.lat, lng: e.latlng.lng }),
  })
  return null
}

function MapPanTo({ location }: { location: SelectedLocation | null }) {
  const map = useMap()
  const initial = useRef(true)
  useEffect(() => {
    if (initial.current) { initial.current = false; return }
    if (location) {
      map.panTo([location.latitude, location.longitude], { duration: 0.5 })
    }
  }, [map, location])
  return null
}

export function InteractiveMap({ selectedLocation, onMapClick }: InteractiveMapProps) {
  const center = selectedLocation
    ? [selectedLocation.latitude, selectedLocation.longitude] as [number, number]
    : BRAZIL_CENTER

  return (
    <div className="interactive-map">
      <MapContainer
        center={center}
        zoom={INITIAL_ZOOM}
        className="interactive-map__container"
        scrollWheelZoom
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onClick={onMapClick} />
        {selectedLocation && (
          <Marker
            position={[selectedLocation.latitude, selectedLocation.longitude]}
            icon={markerIcon}
          >
            <Popup>
              <strong>{selectedLocation.name}</strong>
              <br />
              {selectedLocation.latitude}, {selectedLocation.longitude}
            </Popup>
          </Marker>
        )}
        <MapPanTo location={selectedLocation} />
      </MapContainer>
    </div>
  )
}
