import type { GeoPoint, Report, ReportCategory } from '../types/domain'

export const NEARBY_REPORT_RADIUS_METERS = 50

const EARTH_RADIUS_METERS = 6_371_000

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

export function distanceInMeters(first: GeoPoint, second: GeoPoint) {
  const latitudeDelta = toRadians(second.latitude - first.latitude)
  const longitudeDelta = toRadians(second.longitude - first.longitude)
  const firstLatitude = toRadians(first.latitude)
  const secondLatitude = toRadians(second.latitude)
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine))
}

export function findNearbyReports(
  reports: Report[],
  point: GeoPoint,
  category?: ReportCategory,
  radiusMeters = NEARBY_REPORT_RADIUS_METERS,
) {
  return reports
    .filter((report) => report.status !== 'Finalizado')
    .map((report) => ({ report, distance: distanceInMeters(point, report) }))
    .filter(({ distance }) => distance <= radiusMeters)
    .sort((first, second) => {
      const firstMatchesCategory = category && first.report.category === category ? 0 : 1
      const secondMatchesCategory = category && second.report.category === category ? 0 : 1
      return firstMatchesCategory - secondMatchesCategory || first.distance - second.distance
    })
}

export function calculateRouteDistanceKm(points: GeoPoint[]): number {
  if (points.length < 2) return 0
  let totalMeters = 0
  for (let i = 0; i < points.length - 1; i++) {
    totalMeters += distanceInMeters(points[i], points[i + 1])
  }
  return Number((totalMeters / 1000).toFixed(1))
}

export function optimizeRouteOrder<T extends GeoPoint>(points: T[]): T[] {
  if (points.length <= 2) return [...points]
  const unvisited = [...points]
  const result: T[] = [unvisited.shift()!]

  while (unvisited.length > 0) {
    const current = result[result.length - 1]
    let nearestIdx = 0
    let nearestDist = Infinity

    for (let i = 0; i < unvisited.length; i++) {
      const dist = distanceInMeters(current, unvisited[i])
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIdx = i
      }
    }

    result.push(unvisited.splice(nearestIdx, 1)[0])
  }

  return result
}

export interface RouteGeometryResult {
  coordinates: [number, number][]
  distanceKm: number
  durationMinutes: number
  isFallback?: boolean
}

const clientRouteCache = new Map<string, RouteGeometryResult>()

export async function fetchStreetRoute(points: GeoPoint[]): Promise<RouteGeometryResult | null> {
  if (points.length < 2) {
    return {
      coordinates: points.map((p) => [p.latitude, p.longitude]),
      distanceKm: 0,
      durationMinutes: 0,
      isFallback: false,
    }
  }

  const cacheKey = points.map((p) => `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`).join(';')
  if (clientRouteCache.has(cacheKey)) {
    return clientRouteCache.get(cacheKey)!
  }

  const pointsParam = points.map((p) => `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`).join(';')

  // 1. Try internal Next.js proxy route
  try {
    const res = await fetch(`/api/route-path?points=${pointsParam}`)
    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.coordinates) && data.coordinates.length > 0) {
        const isFallback = data.mode === 'fallback'
        const result: RouteGeometryResult = {
          coordinates: data.coordinates,
          distanceKm: data.distanceKm || calculateRouteDistanceKm(points),
          durationMinutes: data.durationMinutes || Math.round(calculateRouteDistanceKm(points) * 3.5),
          isFallback,
        }
        clientRouteCache.set(cacheKey, result)
        return result
      }
    }
  } catch {
    // Continue to direct fallback
  }

  // 2. Try direct OSRM endpoint (has open CORS headers)
  try {
    const osrmCoords = points.map((p) => `${p.longitude},${p.latitude}`).join(';')
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${osrmCoords}?overview=full&geometries=geojson`,
    )
    if (res.ok) {
      const data = await res.json()
      if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
        const rawCoords: [number, number][] = data.routes[0].geometry.coordinates
        const leafletCoords: [number, number][] = rawCoords.map(([lon, lat]) => [lat, lon])
        const distanceKm = Number(((data.routes[0].distance ?? 0) / 1000).toFixed(1))
        const durationMinutes = Math.round((data.routes[0].duration ?? 0) / 60)

        const result: RouteGeometryResult = {
          coordinates: leafletCoords,
          distanceKm,
          durationMinutes,
          isFallback: false,
        }
        clientRouteCache.set(cacheKey, result)
        return result
      }
    }
  } catch {
    // Continue to straight line fallback
  }

  // 3. Fallback: straight lines between points
  const fallbackDistance = calculateRouteDistanceKm(points)
  const fallbackResult: RouteGeometryResult = {
    coordinates: points.map((p) => [p.latitude, p.longitude]),
    distanceKm: fallbackDistance,
    durationMinutes: Math.round(fallbackDistance * 3.5),
    isFallback: true,
  }
  return fallbackResult
}

