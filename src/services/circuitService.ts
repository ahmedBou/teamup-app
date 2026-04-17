import { XMLParser } from 'fast-xml-parser'
import { supabase } from '../lib/supabase'
import type {
  Circuit,
  CreateCircuitInput,
  GeoJsonLineString,
  UpdateCircuitInput,
} from '../types/circuit'

export function parseGpxToLineString(gpxText: string): GeoJsonLineString {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  })

  const result = parser.parse(gpxText)

  const trk = result?.gpx?.trk
  const trkseg = Array.isArray(trk?.trkseg) ? trk.trkseg[0] : trk?.trkseg
  const trkpts = trkseg?.trkpt

  if (!trkpts) {
    throw new Error('GPX invalide : aucun segment de tracé trouvé.')
  }

  const points = Array.isArray(trkpts) ? trkpts : [trkpts]

  const coordinates: [number, number][] = points.map((pt: any) => [
    parseFloat(pt['@_lon']),
    parseFloat(pt['@_lat']),
  ])

  if (coordinates.length < 2) {
    throw new Error('GPX invalide : tracé trop court.')
  }

  return {
    type: 'LineString',
    coordinates,
  }
}

const R = 6371

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

export function calculateDistanceKm(line: GeoJsonLineString): number {
  let total = 0
  const coords = line.coordinates

  for (let i = 1; i < coords.length; i++) {
    const [lon1, lat1] = coords[i - 1]
    const [lon2, lat2] = coords[i]

    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2

    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  return Math.round(total * 10) / 10
}

export function getStartPoint(
  line: GeoJsonLineString
): { start_lat: number; start_lng: number } {
  const [lng, lat] = line.coordinates[0]
  return { start_lat: lat, start_lng: lng }
}

function simplifyCoordinates(
  coordinates: [number, number][],
  maxPoints = 120
): [number, number][] {
  if (coordinates.length <= maxPoints) return coordinates

  const step = Math.ceil(coordinates.length / maxPoints)
  const reduced = coordinates.filter((_, index) => index % step === 0)

  const last = coordinates[coordinates.length - 1]
  const lastReduced = reduced[reduced.length - 1]

  if (
    !lastReduced ||
    lastReduced[0] !== last[0] ||
    lastReduced[1] !== last[1]
  ) {
    reduced.push(last)
  }

  return reduced
}

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN!
const MAPBOX_STYLE = 'mapbox/outdoors-v12'

export function buildMapboxCoverUrl(line: GeoJsonLineString): string {
  const simplifiedLine: GeoJsonLineString = {
    type: 'LineString',
    coordinates: simplifyCoordinates(line.coordinates, 80),
  }

  const lons = simplifiedLine.coordinates.map((c) => c[0])
  const lats = simplifiedLine.coordinates.map((c) => c[1])

  let minLon = Math.min(...lons)
  let minLat = Math.min(...lats)
  let maxLon = Math.max(...lons)
  let maxLat = Math.max(...lats)

  const lonSpan = maxLon - minLon
  const latSpan = maxLat - minLat

  const lonPadding = Math.max(lonSpan * 0.12, 0.01)
  const latPadding = Math.max(latSpan * 0.18, 0.01)

  minLon -= lonPadding
  maxLon += lonPadding
  minLat -= latPadding
  maxLat += latPadding

  const bbox = [minLon, minLat, maxLon, maxLat].join(',')

  const geoJsonOverlay = encodeURIComponent(
    JSON.stringify({
      type: 'Feature',
      properties: {
        'stroke': '#1d4ed8',
        'stroke-width': 4,
        'stroke-opacity': 0.9,
      },
      geometry: simplifiedLine,
    })
  )

  return (
    `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/static/` +
    `geojson(${geoJsonOverlay})/` +
    `[${bbox}]/1200x700@2x` +
    `?padding=24` +
    `&logo=false&attribution=false` +
    `&access_token=${MAPBOX_TOKEN}`
  )
}

export async function uploadCoverToStorage(
  circuitId: string,
  line: GeoJsonLineString
): Promise<string> {
  const url = buildMapboxCoverUrl(line)
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Mapbox cover fetch failed: ${response.status}`)
  }

  const blob = await response.blob()
  const filePath = `circuits/${circuitId}/cover.jpg`

  const { error } = await supabase.storage
    .from('circuit-covers')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (error) throw error

  const { data } = supabase.storage
    .from('circuit-covers')
    .getPublicUrl(filePath)

  return data.publicUrl
}

export async function getAllCircuits(): Promise<Circuit[]> {
  const { data, error } = await supabase
    .from('circuits')
    .select(`
      id,
      name,
      city,
      difficulty,
      distance_km,
      duration_min,
      cover_image_url,
      geojson,
      elevation_gain_m,
      start_lat,
      start_lng,
      is_active,
      created_at,
      updated_at
    `)
    .order('name', { ascending: true })

  if (error) throw error
  return data as Circuit[]
}

export async function getCircuitById(id: string): Promise<Circuit> {
  const { data, error } = await supabase
    .from('circuits')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Circuit
}

export async function createCircuit(input: CreateCircuitInput): Promise<Circuit> {
  const { data, error } = await supabase
    .from('circuits')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Circuit
}

export async function updateCircuit(
  id: string,
  input: UpdateCircuitInput
): Promise<Circuit> {
  const { data, error } = await supabase
    .from('circuits')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Circuit
}

export async function deleteCircuit(id: string): Promise<void> {
  const { error } = await supabase.from('circuits').delete().eq('id', id)
  if (error) throw error
}

export async function createCircuitFromGpx(params: {
  gpxText: string
  name: string
  city: string
  difficulty: Circuit['difficulty']
  duration_min: number
  elevation_gain_m?: number
}): Promise<Circuit> {
  const { gpxText, name, city, difficulty, duration_min, elevation_gain_m } = params

  const lineString = parseGpxToLineString(gpxText)
  const distance_km = calculateDistanceKm(lineString)
  const { start_lat, start_lng } = getStartPoint(lineString)
  const cover_image_url = buildMapboxCoverUrl(lineString)

  const circuit = await createCircuit({
    name,
    city,
    difficulty,
    distance_km,
    duration_min,
    elevation_gain_m: elevation_gain_m ?? null,
    start_lat,
    start_lng,
    geojson: lineString,
    cover_image_url,
    is_active: true,
  })

  return circuit
}

export const circuitService = {
  listActiveCircuits: getAllCircuits,
  getAllCircuits,
  getCircuitById,
  createCircuit,
  updateCircuit,
  deleteCircuit,
  createCircuitFromGpx,
}