'use client'

import { LocateFixed } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '../../navigation'
import { IssueMap } from '../../components/maps/IssueMap'
import { MapFilterAccordion, type MapFilterOption } from '../../components/maps/MapFilterAccordion'
import { OccurrenceDrawer } from '../../components/maps/OccurrenceDrawer'
import { useApp } from '../../context/AppContext'
import { REPORT_CATEGORIES, REPORT_STATUSES, type ReportCategory, type ReportStatus } from '../../types/domain'
import type { GeoPoint } from '../../types/domain'

type FilterValue<T> = T | 'Todos'

const categoryOptions: readonly MapFilterOption<FilterValue<ReportCategory>>[] = [
  { value: 'Todos', label: 'Todas' },
  ...REPORT_CATEGORIES.map((category) => ({ value: category, label: category })),
]

const statusOptions: readonly MapFilterOption<FilterValue<ReportStatus>>[] = [
  { value: 'Todos', label: 'Todos' },
  ...REPORT_STATUSES.map((status) => ({ value: status, label: status })),
]

export function CitizenMapPage() {
  const { reports, user, role, confirmReport } = useApp()
  const navigate = useNavigate()
  const [categoryFilter, setCategoryFilter] = useState<FilterValue<ReportCategory>>('Todos')
  const [statusFilter, setStatusFilter] = useState<FilterValue<ReportStatus>>('Todos')
  const [openFilter, setOpenFilter] = useState<'category' | 'status' | null>(null)
  const [selectedId, setSelectedId] = useState<string>()
  const [userLocation, setUserLocation] = useState<GeoPoint>()
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState('')

  const filteredReports = useMemo(() => reports.filter((report) => {
    const matchesCategory = categoryFilter === 'Todos' || report.category === categoryFilter
    const matchesStatus = statusFilter === 'Todos' || report.status === statusFilter
    return matchesCategory && matchesStatus
  }), [categoryFilter, reports, statusFilter])

  const selectedReport = filteredReports.find((report) => report.id === selectedId)

  useEffect(() => {
    const selectedReportId = new URLSearchParams(window.location.search).get('selectedReportId')
    if (!selectedReportId) return
    setSelectedId(selectedReportId)
    navigate('/app/mapa', { replace: true })
  }, [navigate])

  useEffect(() => {
    if (selectedId && !selectedReport) {
      setSelectedId(undefined)
    }
  }, [selectedId, selectedReport])

  const handleLocate = () => {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Seu navegador não oferece acesso à localização.')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude })
        setIsLocating(false)
      },
      () => {
        setIsLocating(false)
        setLocationError('Não foi possível acessar sua localização. O mapa continua disponível.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 },
    )
  }

  return (
    <div className="map-first-page">
      <div className="map-first-controls" aria-label="Filtros do mapa">
        <MapFilterAccordion
          id="map-category-options"
          label="Categoria"
          value={categoryFilter}
          options={categoryOptions}
          open={openFilter === 'category'}
          onToggle={() => setOpenFilter((current) => current === 'category' ? null : 'category')}
          onChange={setCategoryFilter}
        />
        <MapFilterAccordion
          id="map-status-options"
          label="Status"
          value={statusFilter}
          options={statusOptions}
          open={openFilter === 'status'}
          onToggle={() => setOpenFilter((current) => current === 'status' ? null : 'status')}
          onChange={setStatusFilter}
        />
        <button type="button" className="map-locate-button" onClick={handleLocate} disabled={isLocating} aria-label="Centralizar em minha localização">
          {isLocating ? <span className="button-spinner" aria-hidden="true" /> : <LocateFixed size={18} />}
          <span className="map-locate-label">Minha localização</span>
        </button>
      </div>
      {locationError ? <p className="map-location-error" role="alert">{locationError}</p> : null}
      <IssueMap
        reports={filteredReports}
        selectedId={selectedReport?.id}
        onSelect={(report) => setSelectedId(report.id)}
        focusPoint={userLocation}
        zoom={14}
        scrollWheelZoom
        className="map-first-map"
      />
      {selectedReport ? (
        <OccurrenceDrawer
          report={selectedReport}
          userId={user.id}
          role={role}
          onConfirm={confirmReport}
          onClose={() => setSelectedId(undefined)}
          onViewDetails={() => navigate(`/app/chamados/${selectedReport.id}`)}
        />
      ) : null}
    </div>
  )
}
