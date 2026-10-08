'use client'

import { ChevronDown, List, LocateFixed, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '../../navigation'
import { IssueMap } from '../../components/maps/IssueMap'
import { MapFilterAccordion, type MapFilterOption } from '../../components/maps/MapFilterAccordion'
import { OccurrenceDrawer } from '../../components/maps/OccurrenceDrawer'
import { InterventionDrawer } from '../../components/interventions/InterventionDrawer'
import { CategoryIcon } from '../../components/ui/CategoryIcon'
import { StatusBadge } from '../../components/ui/StatusBadge'
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
  const { reports, interventions, user, role, confirmReport } = useApp()
  const navigate = useNavigate()
  const [categoryFilter, setCategoryFilter] = useState<FilterValue<ReportCategory>>('Todos')
  const [statusFilter, setStatusFilter] = useState<FilterValue<ReportStatus>>('Todos')
  const [openFilter, setOpenFilter] = useState<'category' | 'status' | 'layers' | null>(null)
  const [showReportsLayer, setShowReportsLayer] = useState(true)
  const [showInterventionsLayer, setShowInterventionsLayer] = useState(true)
  const [selectedId, setSelectedId] = useState<string>()
  const [selectedInterventionId, setSelectedInterventionId] = useState<string>()
  const [userLocation, setUserLocation] = useState<GeoPoint>()
  const [userLocationAccuracy, setUserLocationAccuracy] = useState<number>()
  const [mapFocusPoint, setMapFocusPoint] = useState<GeoPoint>()
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [experienceMessage, setExperienceMessage] = useState('')
  const [isListOpen, setIsListOpen] = useState(false)
  const [isHintDismissed, setIsHintDismissed] = useState(false)

  const filteredReports = useMemo(() => reports.filter((report) => {
    const matchesCategory = categoryFilter === 'Todos' || report.category === categoryFilter
    const matchesStatus = statusFilter === 'Todos' || report.status === statusFilter
    return matchesCategory && matchesStatus
  }), [categoryFilter, reports, statusFilter])

  const selectedReport = filteredReports.find((report) => report.id === selectedId)
  const selectedIntervention = interventions.find((item) => item.id === selectedInterventionId)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const interventionParam = searchParams.get('intervencao') || searchParams.get('interventionId')
    if (interventionParam) {
      setSelectedInterventionId(interventionParam)
      setSelectedId(undefined)
      const found = interventions.find((i) => i.id === interventionParam)
      if (found && found.geometry.length > 0) {
        setMapFocusPoint(found.geometry[0])
      }
      navigate('/app/mapa', { replace: true })
      return
    }

    const selectedReportId = searchParams.get('selectedReportId')
    if (!selectedReportId) return
    setSelectedId(selectedReportId)
    setSelectedInterventionId(undefined)
    if (searchParams.get('created') === '1') {
      const createdReport = reports.find((report) => report.id === selectedReportId)
      setExperienceMessage(`Solicitação enviada${createdReport ? ` · ${createdReport.protocol}` : ''}. Você pode acompanhar cada atualização por aqui.`)
    }
    navigate('/app/mapa', { replace: true })
  }, [interventions, navigate, reports])

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
        const location = { latitude: position.coords.latitude, longitude: position.coords.longitude }
        setUserLocation(location)
        setUserLocationAccuracy(position.coords.accuracy)
        setMapFocusPoint(location)
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

        {/* Camadas do Mapa */}
        <div className={`map-filter-control ${openFilter === 'layers' ? 'map-filter-control-open' : ''}`}>
          <button
            type="button"
            className="map-filter-trigger"
            aria-expanded={openFilter === 'layers'}
            onClick={() => setOpenFilter((current) => current === 'layers' ? null : 'layers')}
            aria-label="Controle de camadas do mapa"
          >
            <span className="map-filter-trigger-copy">
              <span className="map-filter-trigger-label">Camadas</span>
              <strong>
                {showReportsLayer && showInterventionsLayer
                  ? 'Todas'
                  : showInterventionsLayer
                    ? 'Intervenções'
                    : 'Ocorrências'}
              </strong>
            </span>
            <ChevronDown className="map-filter-trigger-chevron" size={15} aria-hidden="true" />
          </button>
          <div className="map-filter-options-shell">
            <div className="map-filter-options p-2" role="group" aria-label="Camadas visíveis no mapa">
              <label className="map-layer-toggle-row">
                <input
                  type="checkbox"
                  checked={showReportsLayer}
                  onChange={(e) => setShowReportsLayer(e.target.checked)}
                />
                <span>Ocorrências ({filteredReports.length})</span>
              </label>
              <label className="map-layer-toggle-row">
                <input
                  type="checkbox"
                  checked={showInterventionsLayer}
                  onChange={(e) => setShowInterventionsLayer(e.target.checked)}
                />
                <span>Intervenções ({interventions.length})</span>
              </label>
            </div>
          </div>
        </div>

        <button type="button" className="map-locate-button" onClick={handleLocate} disabled={isLocating} aria-label="Centralizar em minha localização">
          {isLocating ? <span className="button-spinner" aria-hidden="true" /> : <LocateFixed size={18} />}
          <span className="map-locate-label">Minha localização</span>
        </button>
      </div>
      <div className="map-assistance">
        {locationError ? <p className="map-location-error" role="alert">{locationError}</p> : null}
        {!isHintDismissed ? (
          <div className="map-experience-hint">
            <div className="map-experience-hint-body">
              <span>Toque em um marcador ou trecho para ver os detalhes.</span>
              <button type="button" className="map-list-toggle" onClick={() => setIsListOpen(true)}>
                <List size={14} /> Ver em lista
              </button>
            </div>
            <button
              type="button"
              className="map-hint-close-btn"
              onClick={() => setIsHintDismissed(true)}
              aria-label="Fechar dica do mapa"
            >
              <X size={15} />
            </button>
          </div>
        ) : null}
      </div>
      <IssueMap
        reports={filteredReports}
        selectedId={selectedReport?.id}
        onSelect={(report) => {
          setSelectedInterventionId(undefined)
          setSelectedId(report.id)
        }}
        interventions={interventions}
        selectedInterventionId={selectedInterventionId}
        onSelectIntervention={(intervention) => {
          setSelectedId(undefined)
          setSelectedInterventionId(intervention.id)
        }}
        showReportsLayer={showReportsLayer}
        showInterventionsLayer={showInterventionsLayer}
        userLocation={userLocation}
        userLocationAccuracy={userLocationAccuracy}
        focusPoint={mapFocusPoint}
        zoom={15}
        scrollWheelZoom
        className="map-first-map"
      />
      {isListOpen ? (
        <section className="map-report-list" aria-label="Ocorrências exibidas no mapa">
          <header><div><span>Ocorrências próximas</span><strong>{filteredReports.length} chamadas no mapa</strong></div><button type="button" onClick={() => setIsListOpen(false)} aria-label="Fechar lista de ocorrências"><X size={18} /></button></header>
          <div className="map-report-list-scroll">
            {filteredReports.map((report) => <button type="button" key={report.id} className="map-report-list-item" onClick={() => { setSelectedId(report.id); setIsListOpen(false) }}><CategoryIcon category={report.category} size="sm" /><span><strong>{report.category}</strong><small>{report.region}</small></span><StatusBadge status={report.status} compact /></button>)}
          </div>
        </section>
      ) : null}
      {selectedReport ? (
        <OccurrenceDrawer
          report={selectedReport}
          userId={user.id}
          role={role}
          onConfirm={confirmReport}
          onClose={() => { setExperienceMessage(''); setSelectedId(undefined) }}
          onViewDetails={() => navigate(`/app/chamados/${selectedReport.id}`)}
          notice={experienceMessage || undefined}
        />
      ) : null}
      {selectedIntervention ? (
        <InterventionDrawer
          intervention={selectedIntervention}
          role={role}
          onClose={() => setSelectedInterventionId(undefined)}
        />
      ) : null}
    </div>
  )
}
