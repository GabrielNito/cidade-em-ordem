'use client'

import dynamic from 'next/dynamic'
import type { GeoPoint, Report } from '../../types/domain'

export type IssueMapProps = {
  reports: Report[]
  selectedId?: string
  onSelect?: (report: Report) => void
  focusPoint?: GeoPoint
  initialCenter?: GeoPoint
  onCenterChange?: (point: GeoPoint) => void
  showCenterMarker?: boolean
  zoom?: number
  scrollWheelZoom?: boolean
  className?: string
}

const IssueMapClient = dynamic<IssueMapProps>(
  () => import('./IssueMapClient').then((module) => module.IssueMapClient),
  {
    ssr: false,
    loading: () => <div className="issue-map issue-map-loading" aria-label="Carregando mapa" />,
  },
)

export function IssueMap(props: IssueMapProps) {
  return <IssueMapClient {...props} />
}
