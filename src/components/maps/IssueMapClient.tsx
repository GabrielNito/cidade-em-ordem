'use client'

import { divIcon } from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { Circle, CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { MapPin } from 'lucide-react'
import type { GeoPoint, Report, ReportCategory, ScheduledIntervention } from '../../types/domain'
import { statusStyles } from '../../utils/report'
import { fetchStreetRoute, getRenderableRouteCoordinates, type RouteGeometryResult } from '../../utils/geo'
import { interventionStatusStyles } from '../../utils/intervention'

const INDAIATUBA_CENTER: [number, number] = [-23.0903, -47.2181]
const EMPTY_INTERVENTIONS: ScheduledIntervention[] = []
const EMPTY_INTERACTIVE_POINTS: GeoPoint[] = []

const categoryMarkerIcons: Record<ReportCategory, string> = {
  'Buraco na via': '<path d="M5 15.5 8.5 9l4 2.5L16 5l3 3.5-3 5 3 3.5H5Z"/><path d="M8 18h8"/>',
  'Iluminação': '<path d="M12 3a5 5 0 0 0-3 9v2h6v-2a5 5 0 0 0-3-9Z"/><path d="M10 17h4M10.5 20h3"/>',
  Limpeza: '<path d="M8 8h8l-.8 11H8.8L8 8Z"/><path d="M7 8h10M10 5h4l1 3H9l1-3ZM10 11v5M14 11v5"/>',
  'Sinalização': '<path d="M6 4h11l2 3-2 3H6V4ZM6 10v9"/><path d="M9 14h6"/>',
  Poda: '<path d="M12 20v-7"/><path d="M12 13C7 13 5 10 6 6c4 0 6 2 6 7Z"/><path d="M12 15c5 0 7-3 6-7-4 0-6 2-6 7Z"/>',
}

function createMarkerIcon(report: Report, selected: boolean, routeIndex?: number) {
  const isRouted = routeIndex !== undefined && routeIndex >= 0
  const isDone = report.status === 'Finalizado'
  const color = isRouted ? (isDone ? '#15803d' : '#185a4e') : statusStyles[report.status].dot
  const count = report.confirmations?.length ?? 0
  const icon = categoryMarkerIcons[report.category]
  const stopLabel = isRouted ? `Parada ${routeIndex + 1}: ` : ''
  const label = `${stopLabel}${report.category}, ${report.status}, ${count} ${count === 1 ? 'confirmação' : 'confirmações'}`
  const coreContent = isRouted
    ? `<span class="map-route-marker-badge ${isDone ? 'map-route-marker-done' : ''}">${isDone ? '✓' : routeIndex + 1}</span>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>`

  return divIcon({
    className: 'map-report-marker-host',
    iconSize: [46, 48],
    iconAnchor: [23, 45],
    popupAnchor: [0, -40],
    html: `<span class="map-report-marker ${selected ? 'map-report-marker-selected' : ''} ${isRouted ? 'map-report-marker-routed' : ''}" data-report-id="${report.id}" style="--marker-color:${color}" role="button" tabindex="0" aria-label="${label}">
      <span class="map-report-marker-core">${coreContent}</span>
      ${count > 0 ? `<span class="map-report-marker-count" aria-hidden="true">${count}</span>` : ''}
    </span>`,
  })
}

function createInterventionMarkerIcon(intervention: ScheduledIntervention, selected: boolean) {
  const isCancelled = intervention.status === 'Cancelada'
  const isFinished = intervention.status === 'Encerrada'
  const isOngoing = intervention.status === 'Em andamento'
  const color = isCancelled
    ? '#64748b'
    : isFinished
      ? '#16a34a'
      : isOngoing
        ? '#ea580c'
        : '#d97706'

  const statusShort = isOngoing ? 'OBRA' : isCancelled ? 'CANCELADA' : isFinished ? 'LIBERADA' : 'AVISO'

  return divIcon({
    className: 'map-intervention-marker-host',
    iconSize: [44, 46],
    iconAnchor: [22, 23],
    popupAnchor: [0, -22],
    html: `<span class="map-intervention-marker ${selected ? 'map-intervention-marker-selected' : ''}" data-intervention-id="${intervention.id}" style="--marker-color:${color}" role="button" tabindex="0" aria-label="Intervenção municipal: ${intervention.title}, ${intervention.impact}, ${intervention.status}">
      <span class="map-intervention-marker-core">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m2 22 10-20 10 20Z"/>
          <path d="M6 14h12"/>
          <path d="M8 18h8"/>
        </svg>
      </span>
      <span class="map-intervention-marker-badge">${statusShort}</span>
    </span>`,
  })
}

function createDraftPointIcon(index: number) {
  return divIcon({
    className: 'map-draft-point-host',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<span class="map-draft-point-pin">${index + 1}</span>`,
  })
}

function UserLocationMarker({ location, accuracy }: { location: GeoPoint; accuracy?: number }) {
  const position: [number, number] = [location.latitude, location.longitude]
  const accuracyRadius = Number.isFinite(accuracy) ? Math.min(Math.max(accuracy ?? 0, 18), 250) : 36

  return (
    <>
      <Circle
        center={position}
        radius={accuracyRadius}
        pathOptions={{
          color: '#2563eb',
          fillColor: '#60a5fa',
          fillOpacity: 0.14,
          opacity: 0.7,
          weight: 1.5,
        }}
      />
      <CircleMarker
        center={position}
        radius={7}
        pathOptions={{
          color: '#ffffff',
          fillColor: '#2563eb',
          fillOpacity: 1,
          opacity: 1,
          weight: 2.5,
        }}
      />
    </>
  )
}

function MapViewport({
  selectedReport,
  selectedIntervention,
  focusPoint,
  onCenterChange,
}: {
  selectedReport?: Report
  selectedIntervention?: ScheduledIntervention
  focusPoint?: GeoPoint
  onCenterChange?: (point: GeoPoint) => void
}) {
  const map = useMap()

  useMapEvents({
    moveend: () => {
      if (!onCenterChange) return
      const center = map.getCenter()
      onCenterChange({ latitude: center.lat, longitude: center.lng })
    },
  })

  useEffect(() => {
    if (selectedReport) {
      map.flyTo([selectedReport.latitude, selectedReport.longitude], Math.max(map.getZoom(), 14), { duration: 0.45 })
    }
  }, [map, selectedReport])

  useEffect(() => {
    if (selectedIntervention && selectedIntervention.geometry.length > 0) {
      const target = selectedIntervention.geometry[0]
      map.flyTo([target.latitude, target.longitude], Math.max(map.getZoom(), 15), { duration: 0.45 })
    }
  }, [map, selectedIntervention])

  useEffect(() => {
    if (focusPoint) {
      map.flyTo([focusPoint.latitude, focusPoint.longitude], Math.max(map.getZoom(), 15), { duration: 0.45 })
    }
  }, [focusPoint, map])

  return null
}

function MapInteractiveClickHandler({
  isInteractiveDrawing,
  onAddInteractivePoint,
}: {
  isInteractiveDrawing?: boolean
  onAddInteractivePoint?: (point: GeoPoint) => void
}) {
  useMapEvents({
    click: (e) => {
      if (isInteractiveDrawing && onAddInteractivePoint) {
        onAddInteractivePoint({ latitude: e.latlng.lat, longitude: e.latlng.lng })
      }
    },
  })
  return null
}

export function IssueMapClient({
  reports,
  selectedId,
  onSelect,
  userLocation,
  userLocationAccuracy,
  focusPoint,
  initialCenter,
  onCenterChange,
  showCenterMarker = false,
  zoom = 13,
  scrollWheelZoom = false,
  className = '',
  routePoints,
  onRouteToggle,
  interventions = EMPTY_INTERVENTIONS,
  selectedInterventionId,
  onSelectIntervention,
  showInterventionsLayer = true,
  showReportsLayer = true,
  interactivePoints = EMPTY_INTERACTIVE_POINTS,
  onAddInteractivePoint,
  isInteractiveDrawing = false,
}: {
  reports: Report[]
  selectedId?: string
  onSelect?: (report: Report) => void
  userLocation?: GeoPoint
  userLocationAccuracy?: number
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
}) {
  const selectedReport = reports.find((report) => report.id === selectedId)
  const selectedIntervention = interventions.find((item) => item.id === selectedInterventionId)
  const mapRootRef = useRef<HTMLDivElement>(null)
  const [streetRouteCoords, setStreetRouteCoords] = useState<[number, number][]>([])
  const [isStreetFallback, setIsStreetFallback] = useState(false)
  const [interventionRouteResults, setInterventionRouteResults] = useState<Record<string, RouteGeometryResult>>({})
  const [draftRouteResult, setDraftRouteResult] = useState<RouteGeometryResult | null>(null)

  // Fetch real road-network geometry following streets for crew route
  useEffect(() => {
    if (!routePoints || routePoints.length < 2) {
      setStreetRouteCoords([])
      setIsStreetFallback(false)
      return
    }

    let active = true
    fetchStreetRoute(routePoints).then((result) => {
      if (active && result && result.coordinates.length > 0) {
        setStreetRouteCoords(result.coordinates)
        setIsStreetFallback(Boolean(result.isFallback))
      }
    })

    return () => {
      active = false
    }
  }, [routePoints])

  // Interventions and their registration draft must use the road network too;
  // the clicked points are anchors, not the final line to paint over the map.
  useEffect(() => {
    if (!showInterventionsLayer || interventions.length === 0) {
      setInterventionRouteResults({})
      return
    }

    let active = true
    setInterventionRouteResults({})

    Promise.all(
      interventions.map(async (intervention) => {
        const route = await fetchStreetRoute(intervention.geometry)
        return route ? ([intervention.id, route] as const) : null
      }),
    ).then((entries) => {
      if (!active) return
      setInterventionRouteResults(
        Object.fromEntries(entries.filter((entry): entry is [string, RouteGeometryResult] => entry !== null)),
      )
    })

    return () => {
      active = false
    }
  }, [interventions, showInterventionsLayer])

  useEffect(() => {
    if (!isInteractiveDrawing || interactivePoints.length < 2) {
      setDraftRouteResult(null)
      return
    }

    let active = true
    setDraftRouteResult(null)
    fetchStreetRoute(interactivePoints).then((result) => {
      if (active) setDraftRouteResult(result)
    })

    return () => {
      active = false
    }
  }, [interactivePoints, isInteractiveDrawing])

  const polylinePositions =
    streetRouteCoords.length > 0
      ? streetRouteCoords
      : routePoints && routePoints.length > 1
        ? routePoints.map((r) => [r.latitude, r.longitude] as [number, number])
        : []

  useEffect(() => {
    const root = mapRootRef.current
    if (!root) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return

      // Occurrence marker selection
      const reportMarker = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('.map-report-marker') : null
      const report = reportMarker?.dataset.reportId ? reports.find((item) => item.id === reportMarker.dataset.reportId) : undefined
      if (report) {
        event.preventDefault()
        if (onRouteToggle) {
          onRouteToggle(report)
        } else {
          onSelect?.(report)
        }
        return
      }

      // Intervention marker selection
      const intervMarker = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('.map-intervention-marker') : null
      const intervention = intervMarker?.dataset.interventionId ? interventions.find((i) => i.id === intervMarker.dataset.interventionId) : undefined
      if (intervention) {
        event.preventDefault()
        onSelectIntervention?.(intervention)
      }
    }
    root.addEventListener('keydown', handleKeyDown)
    return () => root.removeEventListener('keydown', handleKeyDown)
  }, [interventions, onRouteToggle, onSelect, onSelectIntervention, reports])

  return (
    <div ref={mapRootRef} className={`issue-map ${className}`}>
      <MapContainer
        center={[
          initialCenter?.latitude ?? focusPoint?.latitude ?? INDAIATUBA_CENTER[0],
          initialCenter?.longitude ?? focusPoint?.longitude ?? INDAIATUBA_CENTER[1],
        ]}
        zoom={zoom}
        scrollWheelZoom={scrollWheelZoom}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={20}
        />
        <MapViewport
          selectedReport={selectedReport}
          selectedIntervention={selectedIntervention}
          focusPoint={focusPoint}
          onCenterChange={onCenterChange}
        />
        <MapInteractiveClickHandler
          isInteractiveDrawing={isInteractiveDrawing}
          onAddInteractivePoint={onAddInteractivePoint}
        />

        {/* Tracing of Field Route (Crew Work Orders) */}
        {polylinePositions.length > 1 ? (
          <>
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: '#0d5257',
                weight: 8,
                opacity: 0.32,
                lineJoin: 'round',
                lineCap: 'round',
              }}
            />
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: '#185a4e',
                weight: 4.5,
                opacity: 0.95,
                lineJoin: 'round',
                lineCap: 'round',
              }}
            />
          </>
        ) : null}

        {/* Camada de Intervenções Programadas (Trechos e Marcadores) */}
        {showInterventionsLayer &&
          interventions.map((intervention) => {
            const isSelected = intervention.id === selectedInterventionId
            const routeResult = interventionRouteResults[intervention.id]
            const routeCoords = routeResult
              ? getRenderableRouteCoordinates(intervention.geometry, routeResult)
              : []
            const anchorCoords = getRenderableRouteCoordinates(intervention.geometry, null)
            const markerCoords = routeCoords.length > 0 ? routeCoords : anchorCoords
            const statusStyle = interventionStatusStyles[intervention.status]
            const isCancelled = intervention.status === 'Cancelada'

            // Pick midpoint coordinate for the badge icon
            const midPoint = markerCoords[Math.floor(markerCoords.length / 2)]

            return (
              <div key={intervention.id}>
                {routeCoords.length > 1 ? (
                  <>
                    {/* Outer halo when selected or hover */}
                    <Polyline
                      positions={routeCoords}
                      pathOptions={{
                        color: isSelected ? '#b45309' : statusStyle.polylineColor,
                        weight: isSelected ? 11 : 7,
                        opacity: isSelected ? 0.45 : 0.22,
                        lineJoin: 'round',
                        lineCap: 'round',
                      }}
                      eventHandlers={{
                        click: () => onSelectIntervention?.(intervention),
                      }}
                    />
                    {/* Inner core stroke */}
                    <Polyline
                      positions={routeCoords}
                      pathOptions={{
                        color: statusStyle.polylineColor,
                        weight: isSelected ? 5.5 : 4,
                        opacity: 0.95,
                        dashArray: isCancelled ? '8, 8' : undefined,
                        lineJoin: 'round',
                        lineCap: 'round',
                      }}
                      eventHandlers={{
                        click: () => onSelectIntervention?.(intervention),
                      }}
                    />
                  </>
                ) : null}

                {/* Marcador representativo no trecho */}
                {midPoint ? (
                  <Marker
                    position={midPoint}
                    icon={createInterventionMarkerIcon(intervention, isSelected)}
                    eventHandlers={{
                      click: () => onSelectIntervention?.(intervention),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -22]} opacity={0.96}>
                      <strong>{intervention.title}</strong>
                      <br />
                      <span>
                        {intervention.type} · {intervention.impact} ({intervention.status})
                      </span>
                    </Tooltip>
                  </Marker>
                ) : null}
              </div>
            )
          })}

        {/* Rascunho interativo de pontos durante cadastro de intervenção pela Gestão */}
        {isInteractiveDrawing && interactivePoints.length > 0 ? (
          <>
            {draftRouteResult ? (
              <Polyline
                positions={getRenderableRouteCoordinates(interactivePoints, draftRouteResult)}
                pathOptions={{
                  color: '#ea580c',
                  weight: 4.5,
                  opacity: 0.9,
                  dashArray: '6, 6',
                  lineJoin: 'round',
                  lineCap: 'round',
                }}
              />
            ) : null}
            {interactivePoints.map((point, idx) => (
              <Marker
                key={`draft-point-${idx}-${point.latitude}-${point.longitude}`}
                position={[point.latitude, point.longitude]}
                icon={createDraftPointIcon(idx)}
              >
                <Tooltip permanent direction="top" offset={[0, -12]}>
                  Ponto {idx + 1}
                </Tooltip>
              </Marker>
            ))}
          </>
        ) : null}

        {/* Camada de Ocorrências (Zeladoria Urbana) */}
        {showReportsLayer &&
          reports.map((report) => {
            const selected = report.id === selectedId
            const routeIndex = routePoints ? routePoints.findIndex((r) => r.id === report.id) : undefined
            return (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={createMarkerIcon(report, selected, routeIndex)}
                eventHandlers={{
                  click: () => {
                    if (onRouteToggle) {
                      onRouteToggle(report)
                    } else {
                      onSelect?.(report)
                    }
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -34]} opacity={0.96}>
                  {onRouteToggle
                    ? routeIndex !== undefined && routeIndex >= 0
                      ? `Parada ${routeIndex + 1}: ${report.category} (${report.region}) · Clique para remover da rota`
                      : `Adicionar à rota: ${report.category} (${report.region})`
                    : routeIndex !== undefined && routeIndex >= 0
                      ? `Parada ${routeIndex + 1}: ${report.category} · ${report.status}`
                      : `${report.category} · ${report.status}`}
                </Tooltip>
              </Marker>
            )
          })}

        {userLocation ? <UserLocationMarker location={userLocation} accuracy={userLocationAccuracy} /> : null}
      </MapContainer>

      {showCenterMarker ? (
        <div className="map-center-marker" aria-hidden="true">
          <MapPin size={42} strokeWidth={1.8} />
        </div>
      ) : null}

      {showReportsLayer && reports.length === 0 && (!showInterventionsLayer || interventions.length === 0) ? (
        <div className="map-empty-overlay">
          <span>Nenhum elemento encontrado neste recorte.</span>
        </div>
      ) : null}

      <div className="map-legend" aria-label="Legenda do mapa">
        {showReportsLayer &&
          Object.entries(statusStyles).map(([status, style]) => (
            <span key={status} className="map-legend-item">
              <i style={{ backgroundColor: style.dot }} aria-hidden="true" />
              {status}
            </span>
          ))}
        {showInterventionsLayer && interventions.length > 0 ? (
          <span className="map-legend-item map-legend-intervention">
            <i style={{ backgroundColor: '#ea580c' }} aria-hidden="true" />
            Intervenções / Obras
          </span>
        ) : null}
        {routePoints && routePoints.length > 1 ? (
          <span className="map-legend-item">
            <i style={{ backgroundColor: '#185a4e' }} aria-hidden="true" />
            {isStreetFallback ? 'Rota (estimativa geométrica)' : 'Rota pelas vias'}
          </span>
        ) : null}
      </div>
    </div>
  )
}
