import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Region } from '../types'
import 'leaflet/dist/leaflet.css'
import './InteractiveMap.css'

const BRAZIL_CENTER: [number, number] = [-14.2350, -51.9253]
const BRAZIL_ZOOM = 4
const REGION_ZOOM = 8

function fixLeafletIcons() {
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

fixLeafletIcons()

const selectedIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'marker-selected',
})

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function isValidCoordinate(region: Region): boolean {
  return (
    region.latitude !== null &&
    region.latitude !== undefined &&
    region.longitude !== null &&
    region.longitude !== undefined &&
    !Number.isNaN(Number(region.latitude)) &&
    !Number.isNaN(Number(region.longitude))
  )
}

function getCenter(regions: Region[]): [number, number] {
  const valid = regions.filter(isValidCoordinate)
  if (valid.length > 0) {
    return [Number(valid[0].latitude), Number(valid[0].longitude)]
  }
  return BRAZIL_CENTER
}

function MapUpdater({ region }: { region: Region | null }) {
  const map = useMap()
  const initial = useRef(true)

  useEffect(() => {
    if (initial.current) {
      initial.current = false
      return
    }
    if (region && isValidCoordinate(region)) {
      map.flyTo([Number(region.latitude), Number(region.longitude)], REGION_ZOOM, {
        duration: 0.8,
      })
    }
  }, [map, region])

  return null
}

interface InteractiveMapProps {
  regions: Region[]
  selectedId: number | null
  onSelect: (region: Region) => void
}

export function InteractiveMap({ regions, selectedId, onSelect }: InteractiveMapProps) {
  const selectedRegion = regions.find((r) => r.id === selectedId) ?? null
  const center = selectedRegion && isValidCoordinate(selectedRegion)
    ? [Number(selectedRegion.latitude), Number(selectedRegion.longitude)] as [number, number]
    : getCenter(regions)
  const zoom = selectedRegion && isValidCoordinate(selectedRegion) ? REGION_ZOOM : BRAZIL_ZOOM

  const validRegions = regions.filter(isValidCoordinate)

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

        {validRegions.map((region) => (
          <Marker
            key={region.id}
            position={[Number(region.latitude), Number(region.longitude)]}
            icon={region.id === selectedId ? selectedIcon : defaultIcon}
            eventHandlers={{
              click: () => onSelect(region),
            }}
          >
            <Popup>
              <strong>{region.name}</strong>
              <br />
              {region.state} &mdash; {region.latitude}, {region.longitude}
            </Popup>
          </Marker>
        ))}

        <MapUpdater region={selectedRegion} />
      </MapContainer>
    </div>
  )
}
