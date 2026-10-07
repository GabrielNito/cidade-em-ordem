'use client'

import { divIcon } from 'leaflet'
import { useEffect, useRef } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { MapPin } from 'lucide-react'
import type { GeoPoint, Report, ReportCategory } from '../../types/domain'
import { statusStyles } from '../../utils/report'

const INDAIATUBA_CENTER: [number, number] = [-23.0903, -47.2181]

const categoryMarkerIcons: Record<ReportCategory, string> = {
  'Buraco na via': '<path d="M5 15.5 8.5 9l4 2.5L16 5l3 3.5-3 5 3 3.5H5Z"/><path d="M8 18h8"/>',
  'Iluminação': '<path d="M12 3a5 5 0 0 0-3 9v2h6v-2a5 5 0 0 0-3-9Z"/><path d="M10 17h4M10.5 20h3"/>',
  Limpeza: '<path d="M8 8h8l-.8 11H8.8L8 8Z"/><path d="M7 8h10M10 5h4l1 3H9l1-3ZM10 11v5M14 11v5"/>',
  'Sinalização': '<path d="M6 4h11l2 3-2 3H6V4ZM6 10v9"/><path d="M9 14h6"/>',
  Poda: '<path d="M12 20v-7"/><path d="M12 13C7 13 5 10 6 6c4 0 6 2 6 7Z"/><path d="M12 15c5 0 7-3 6-7-4 0-6 2-6 7Z"/>',
}

function createMarkerIcon(report: Report, selected: boolean) {
  const color = statusStyles[report.status].dot
  const count = report.confirmations?.length ?? 0
  const icon = categoryMarkerIcons[report.category]
  const label = `${report.category}, ${report.status}, ${count} ${count === 1 ? 'confirmação' : 'confirmações'}`
  return divIcon({
    className: 'map-report-marker-host',
    iconSize: [46, 48],
    iconAnchor: [23, 45],
    popupAnchor: [0, -40],
    html: `<span class="map-report-marker ${selected ? 'map-report-marker-selected' : ''}" data-report-id="${report.id}" style="--marker-color:${color}" role="button" tabindex="0" aria-label="${label}">
      <span class="map-report-marker-core"><svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg></span>
      ${count > 0 ? `<span class="map-report-marker-count" aria-hidden="true">${count}</span>` : ''}
    </span>`,
  })
}

function MapViewport({
  selectedReport,
  focusPoint,
  onCenterChange,
}: {
  selectedReport?: Report
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
    if (focusPoint) {
      map.flyTo([focusPoint.latitude, focusPoint.longitude], Math.max(map.getZoom(), 15), { duration: 0.45 })
    }
  }, [focusPoint, map])

  return null
}

export function IssueMapClient({
  reports,
  selectedId,
  onSelect,
  focusPoint,
  initialCenter,
  onCenterChange,
  showCenterMarker = false,
  zoom = 13,
  scrollWheelZoom = false,
  className = '',
}: {
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
}) {
  const selectedReport = reports.find((report) => report.id === selectedId)
  const mapRootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = mapRootRef.current
    if (!root) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      const marker = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('.map-report-marker') : null
      const report = marker?.dataset.reportId ? reports.find((item) => item.id === marker.dataset.reportId) : undefined
      if (!report) return
      event.preventDefault()
      onSelect?.(report)
    }
    root.addEventListener('keydown', handleKeyDown)
    return () => root.removeEventListener('keydown', handleKeyDown)
  }, [onSelect, reports])

  return (
    <div ref={mapRootRef} className={`issue-map ${className}`}>
      <MapContainer
        center={[initialCenter?.latitude ?? focusPoint?.latitude ?? INDAIATUBA_CENTER[0], initialCenter?.longitude ?? focusPoint?.longitude ?? INDAIATUBA_CENTER[1]]}
        zoom={zoom}
        scrollWheelZoom={scrollWheelZoom}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={20}
        />
        <MapViewport selectedReport={selectedReport} focusPoint={focusPoint} onCenterChange={onCenterChange} />
        {reports.map((report) => {
          const selected = report.id === selectedId
          return (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={createMarkerIcon(report, selected)}
              eventHandlers={{ click: () => onSelect?.(report) }}
            >
              <Tooltip direction="top" offset={[0, -34]} opacity={0.96}>
                {report.category} · {report.status}
              </Tooltip>
            </Marker>
          )
        })}
      </MapContainer>
      {showCenterMarker ? (
        <div className="map-center-marker" aria-hidden="true">
          <MapPin size={42} strokeWidth={1.8} />
        </div>
      ) : null}
      {reports.length === 0 ? (
        <div className="map-empty-overlay">
          <span>Nenhuma ocorrência encontrada neste recorte.</span>
        </div>
      ) : null}
      <div className="map-legend" aria-label="Legenda de status">
        {Object.entries(statusStyles).map(([status, style]) => (
          <span key={status} className="map-legend-item">
            <i style={{ backgroundColor: style.dot }} aria-hidden="true" />
            {status}
          </span>
        ))}
      </div>
    </div>
  )
}
