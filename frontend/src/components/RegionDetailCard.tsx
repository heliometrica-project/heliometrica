import type { SelectedLocation } from '../types'
import './RegionDetailCard.css'

interface RegionDetailCardProps {
  location: SelectedLocation | null
}

export function RegionDetailCard({ location }: RegionDetailCardProps) {
  if (!location) {
    return (
      <div className="region-detail region-detail--empty">
        <p className="region-detail__empty-text">
          Clique no mapa ou pesquise por uma localidade.
        </p>
      </div>
    )
  }

  return (
    <div className="region-detail">
      <h3 className="region-detail__title">Detalhes da Localidade</h3>
      <dl className="region-detail__list">
        <div className="region-detail__row">
          <dt>Nome</dt>
          <dd>{location.name}</dd>
        </div>
        <div className="region-detail__row">
          <dt>Estado</dt>
          <dd>{location.state}</dd>
        </div>
        <div className="region-detail__row">
          <dt>Latitude</dt>
          <dd>{location.latitude}</dd>
        </div>
        <div className="region-detail__row">
          <dt>Longitude</dt>
          <dd>{location.longitude}</dd>
        </div>
        <div className="region-detail__row">
          <dt>Origem</dt>
          <dd>
            <span className={`region-detail__source region-detail__source--${location.source}`}>
              {location.source === 'region' ? 'Região cadastrada' : 'OpenStreetMap'}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  )
}
