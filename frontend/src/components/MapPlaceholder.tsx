import './MapPlaceholder.css'

export function MapPlaceholder() {
  return (
    <div className="map-placeholder">
      <div className="map-placeholder__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <p className="map-placeholder__text">Mapa da Região</p>
      <p className="map-placeholder__hint">
        Selecione uma região no painel ao lado para visualizar o mapa.
      </p>
    </div>
  )
}
