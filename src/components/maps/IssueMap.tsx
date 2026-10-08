'use client'

import dynamic from 'next/dynamic'
import type { GeoPoint, Report, ScheduledIntervention } from '../../types/domain'

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
  routePoints?: Report[]
  onRouteToggle?: (report: Report) => void
  interventions?: ScheduledIntervention[]
  selectedInterventionId?: string
  onSelectIntervention?: (intervention: ScheduledIntervention) => void
  showInterventionsLayer?: boolean
  showReportsLayer?: boolean
  interactivePoints?: GeoPoint[]
  onAddInteractivePoint?: (point: GeoPoint) => void
  isInteractiveDrawing?: boolean
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
