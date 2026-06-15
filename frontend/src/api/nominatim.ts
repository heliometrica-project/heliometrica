const NOMINATIM_URL = 'https://nominatim.openstreetmap.org'

interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  municipality?: string
  city_district?: string
  county?: string
  state?: string
  country?: string
}

export interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  address: NominatimAddress
}

function extractLocality(addr: NominatimAddress): string {
  return (
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.city_district ||
    addr.county ||
    ''
  )
}

function extractState(addr: NominatimAddress): string {
  if (!addr.state) return ''
  const parts = addr.state.split(' / ')
  return parts[0]
}

export function parseResult(item: NominatimResult): {
  name: string
  state: string
} {
  const locality = extractLocality(item.address)
  const stateAbbr = extractState(item.address)
  const name = locality || item.display_name.split(',')[0].trim()
  return { name, state: stateAbbr }
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<NominatimResult | null> {
  const url = `${NOMINATIM_URL}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Heliometrica/1.0 (solar-energy-app)',
    },
  })
  if (!res.ok) return null
  const data = await res.json()
  if (data.error) return null
  return data as NominatimResult
}

export async function searchLocation(
  query: string
): Promise<NominatimResult[]> {
  const url = `${NOMINATIM_URL}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Heliometrica/1.0 (solar-energy-app)',
    },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data as NominatimResult[]
}
