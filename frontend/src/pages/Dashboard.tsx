import { useState } from 'react'
import type { Region } from '../types'
import { RegionList } from '../components/RegionList'
import { MapPlaceholder } from '../components/MapPlaceholder'
import { RegionDetailCard } from '../components/RegionDetailCard'
import { ChartPlaceholder } from '../components/ChartPlaceholder'
import './Dashboard.css'

export function Dashboard() {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)

  return (
    <div className="dashboard">
      <RegionList
        selectedId={selectedRegion?.id ?? null}
        onSelect={setSelectedRegion}
      />

      <div className="dashboard__content">
        <div className="dashboard__map">
          <MapPlaceholder />
        </div>

        <div className="dashboard__bottom">
          <RegionDetailCard region={selectedRegion} />
          <ChartPlaceholder />
        </div>
      </div>
    </div>
  )
}
