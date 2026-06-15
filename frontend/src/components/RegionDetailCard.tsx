import type { Region } from '../types'
import './RegionDetailCard.css'

interface RegionDetailCardProps {
  region: Region | null
}

export function RegionDetailCard({ region }: RegionDetailCardProps) {
  if (!region) {
    return (
      <div className="region-detail region-detail--empty">
        <p className="region-detail__empty-text">
          Selecione uma região para ver os detalhes.
        </p>
      </div>
    )
  }

  return (
    <div className="region-detail">
      <h3 className="region-detail__title">Detalhes da Região</h3>
      <dl className="region-detail__list">
        <div className="region-detail__row">
          <dt>Nome</dt>
          <dd>{region.name}</dd>
        </div>
        <div className="region-detail__row">
          <dt>Estado</dt>
          <dd>{region.state}</dd>
        </div>
        <div className="region-detail__row">
          <dt>Latitude</dt>
          <dd>{region.latitude}</dd>
        </div>
        <div className="region-detail__row">
          <dt>Longitude</dt>
          <dd>{region.longitude}</dd>
        </div>
      </dl>
    </div>
  )
}
