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

const COLORS = ['#d97706', '#059669', '#2563eb', '#dc2626', '#7c3aed', '#db2777', '#0891b2', '#65a30d']

function createColoredIcon(color: string) {
  return L.divIcon({
    className: 'interactive-map__custom-marker',
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
}

interface InteractiveMapProps {
  selectedLocation: SelectedLocation | null
  onMapClick: (latlng: { lat: number; lng: number }) => void
}

interface MultiMarkerMapProps {
  markers: { id: number; name: string; latitude: number; longitude: number }[]
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

function MapFitBounds({ markers }: { markers: { latitude: number; longitude: number }[] }) {
  const map = useMap()
  const prevCount = useRef(0)
  useEffect(() => {
    if (markers.length === prevCount.current) return
    prevCount.current = markers.length
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.latitude, m.longitude] as [number, number]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 })
    }
  }, [map, markers])
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

export function MultiMarkerMap({ markers, onMapClick }: MultiMarkerMapProps) {
  return (
    <div className="interactive-map interactive-map--multi">
      <MapContainer
        center={BRAZIL_CENTER}
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
        {markers.map((m, i) => (
          <Marker
            key={m.id}
            position={[m.latitude, m.longitude]}
            icon={createColoredIcon(COLORS[i % COLORS.length])}
          >
            <Popup>
              <strong>{m.name}</strong>
              <br />
              {m.latitude.toFixed(4)}, {m.longitude.toFixed(4)}
            </Popup>
          </Marker>
        ))}
        <MapFitBounds markers={markers} />
      </MapContainer>
    </div>
  )
}
