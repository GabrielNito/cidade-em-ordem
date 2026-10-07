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

