'use client'

import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Filter,
  MapPin,
  Navigation,
  Route,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Link } from '../../navigation'
import { IssueMap } from '../../components/maps/IssueMap'
import { ReportCard } from '../../components/reports/ReportCard'
import { CategoryIcon } from '../../components/ui/CategoryIcon'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApp } from '../../context/AppContext'
import type { Report, ReportStatus } from '../../types/domain'

const filters: Array<'Todos' | ReportStatus> = ['Todos', 'Aberto', 'Em atendimento', 'Finalizado']
const ACTIVE_ROUTE_STORAGE_KEY = 'cidade-em-ordem:active-route:v1'
const DEFAULT_COMPLETION_PHOTO =
  'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=1200&q=82'

function fileToDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(file)
  })
}

export function FieldOrdersPage() {
  const { reports, startReport, finishReport } = useApp()
  const [viewMode, setViewMode] = useState<'lista' | 'rota'>('lista')
  const [filter, setFilter] = useState<(typeof filters)[number]>('Todos')
  const [activeStopIndex, setActiveStopIndex] = useState(0)
  const [activeRouteInfo, setActiveRouteInfo] = useState<{
    crewName: string
    reportIds: string[]
  } | null>(null)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const [completionPhotoPreview, setCompletionPhotoPreview] = useState<string | null>(null)
  const [isFinishing, setIsFinishing] = useState(false)

  // Load dispatched route from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(ACTIVE_ROUTE_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && Array.isArray(parsed.reportIds)) {
          setActiveRouteInfo(parsed)
        }
      }
    } catch {
      // Ignore parse error
    }
  }, [])

  const visibleReports = useMemo(
    () =>
      reports
        .filter((report) => filter === 'Todos' || report.status === filter)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [filter, reports],
  )

  // Daily route stops: dispatched sequence first, or active orders (open & in progress)
  const routeOrders = useMemo(() => {
    if (activeRouteInfo && activeRouteInfo.reportIds.length > 0) {
      const matched = activeRouteInfo.reportIds
        .map((id) => reports.find((r) => r.id === id))
        .filter((r): r is Report => Boolean(r))
      if (matched.length > 0) return matched
    }
    const active = reports.filter((r) => r.status !== 'Finalizado')
    return active.length > 0 ? active : reports
  }, [activeRouteInfo, reports])

  const currentStop: Report | undefined = routeOrders[activeStopIndex] ?? routeOrders[0]

  const completedStopsCount = useMemo(
    () => routeOrders.filter((r) => r.status === 'Finalizado').length,
    [routeOrders],
  )

  const progressPercent =
    routeOrders.length > 0 ? Math.round((completedStopsCount / routeOrders.length) * 100) : 0

  const handleStartCurrentStop = () => {
    if (!currentStop) return
    try {
      startReport(currentStop.id)
      setActionFeedback(`Atendimento da parada #${activeStopIndex + 1} iniciado com sucesso!`)
      window.setTimeout(() => setActionFeedback(null), 4000)
    } catch (err) {
      setActionFeedback(err instanceof Error ? err.message : 'Não foi possível iniciar o chamado.')
    }
  }

  const handleFinishCurrentStop = async () => {
    if (!currentStop) return
    setIsFinishing(true)
    try {
      const photo = completionPhotoPreview || DEFAULT_COMPLETION_PHOTO
      finishReport(currentStop.id, photo)
      setCompletionPhotoPreview(null)
      setActionFeedback(`Parada #${activeStopIndex + 1} declarada como concluída com sucesso!`)
      window.setTimeout(() => setActionFeedback(null), 4000)

      // Advance to next unfinished stop if available
      const nextPendingIdx = routeOrders.findIndex(
        (r, idx) => idx > activeStopIndex && r.status !== 'Finalizado',
      )
      if (nextPendingIdx !== -1) {
        setActiveStopIndex(nextPendingIdx)
      }
    } catch (err) {
      setActionFeedback(err instanceof Error ? err.message : 'Não foi possível finalizar o chamado.')
    } finally {
      setIsFinishing(false)
    }
  }

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await fileToDataUrl(file)
      setCompletionPhotoPreview(dataUrl)
      setActionFeedback('Foto de conclusão anexada! Clique em "Declarar como pronta" para salvar.')
      window.setTimeout(() => setActionFeedback(null), 4000)
    } catch {
      setActionFeedback('Não foi possível processar a fotografia.')
    }
  }

  const handleJumpToNextPending = () => {
    const nextPendingIdx = routeOrders.findIndex((r) => r.status !== 'Finalizado')
    if (nextPendingIdx !== -1) {
      setActiveStopIndex(nextPendingIdx)
    }
  }

  return (
    <div className="content-stack field-page-wrap">
      <PageHeader
        eyebrow="Operação em campo"
        title="Ordens de serviço"
        description="Acompanhe as ocorrências operacionais e execute a rota do dia em Indaiatuba."
        action={
          <span className="field-counter">
            <ClipboardList size={16} /> {reports.length} registros
          </span>
        }
      />

      <div className="field-view-mode-tabs" role="tablist" aria-label="Visualização de ordens">
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'lista'}
          className={`field-mode-btn ${viewMode === 'lista' ? 'field-mode-btn-active' : ''}`}
          onClick={() => setViewMode('lista')}
        >
          <ClipboardList size={16} />
          <span>Lista de ordens ({visibleReports.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'rota'}
          className={`field-mode-btn ${viewMode === 'rota' ? 'field-mode-btn-active' : ''}`}
          onClick={() => setViewMode('rota')}
        >
          <Route size={16} />
          <span>Rota do dia no mapa ({routeOrders.length} paradas)</span>
        </button>
      </div>

      {viewMode === 'lista' ? (
        <>
          <div className="filter-tabs field-filter-tabs" role="tablist" aria-label="Filtrar ordens por status">
            {filters.map((item) => (
              <button
                key={item}
                role="tab"
                aria-selected={filter === item}
                className={filter === item ? 'filter-tab filter-tab-active' : 'filter-tab'}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {visibleReports.length ? (
            <div className="report-list">
              {visibleReports.map((report) => (
                <ReportCard key={report.id} report={report} detailPath={`/campo/ordens/${report.id}`} field />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={filter === 'Todos' ? ClipboardList : Filter}
              title="Nenhuma ordem neste filtro"
              description="Quando houver registros correspondentes, eles aparecerão aqui."
              action={
                <button className="button-secondary button-small" onClick={() => setFilter('Todos')}>
                  Limpar filtro
                </button>
              }
            />
          )}
        </>
      ) : (
        <section className="field-route-section" aria-label="Rota do dia da equipe de campo">
          <div className="field-route-summary-bar">
            <div>
              <p className="eyebrow">Itinerário em Tempo Real</p>
              <h2>Execução da Rota de Hoje</h2>
            </div>
            <span className="route-total-badge">
              <CheckCircle2 size={16} /> {routeOrders.length} paradas na rota
            </span>
          </div>

          {actionFeedback ? (
            <div className="field-action-toast" role="status">
              <CheckCircle2 size={17} />
              <span>{actionFeedback}</span>
            </div>
          ) : null}

          {activeRouteInfo ? (
            <div className="field-dispatched-notice" role="status">
              <Route size={16} />
              <span>
                Itinerário oficial despachado pela Gestão Central para <strong>{activeRouteInfo.crewName}</strong>
              </span>
            </div>
          ) : null}

          {/* Progress Tracker */}
          <div className="field-route-progress-panel">
            <div className="progress-panel-header">
              <span>
                Progresso do dia:{' '}
                <strong>
                  {completedStopsCount} de {routeOrders.length} paradas concluídas
                </strong>
              </span>
              <span className="progress-percent-label">{progressPercent}%</span>
            </div>
            <div className="progress-track-bg">
              <div className="progress-track-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="field-route-map-card">
            <IssueMap
              reports={routeOrders}
              routePoints={routeOrders}
              selectedId={currentStop?.id}
              onSelect={(report) => {
                const index = routeOrders.findIndex((item) => item.id === report.id)
                if (index !== -1) setActiveStopIndex(index)
              }}
              focusPoint={currentStop ? { latitude: currentStop.latitude, longitude: currentStop.longitude } : undefined}
              zoom={15}
              className="field-route-map-canvas"
            />
          </div>

          {currentStop ? (
            <div className="field-stop-active-card">
              <div className="stop-active-header">
                <span className="stop-number-pill">
                  Parada {activeStopIndex + 1} de {routeOrders.length}
                </span>
                <StatusBadge status={currentStop.status} compact />
              </div>

              <div className="stop-active-body">
                <span className="stop-active-icon">
                  <CategoryIcon category={currentStop.category} />
                </span>
                <div className="stop-active-info">
                  <h3>{currentStop.category}</h3>
                  <p className="stop-active-protocol">{currentStop.protocol}</p>
                  <p className="stop-active-address">
                    <MapPin size={15} />
                    <span>{currentStop.address || currentStop.region}</span>
                  </p>
                  <p className="stop-active-desc">{currentStop.description}</p>
                </div>
              </div>

              {/* Direct Real-Time Status Actions */}
              <div className="stop-active-status-action-box">
                {currentStop.status === 'Aberto' && (
                  <button
                    type="button"
                    className="button-primary stop-action-status-btn stop-action-start"
                    onClick={handleStartCurrentStop}
                  >
                    <Wrench size={17} />
                    <span>Iniciar atendimento neste ponto</span>
                  </button>
                )}

                {currentStop.status === 'Em atendimento' && (
                  <div className="stop-active-finish-controls">
                    <button
                      type="button"
                      className="button-primary stop-action-status-btn stop-action-finish"
                      onClick={handleFinishCurrentStop}
                      disabled={isFinishing}
                    >
                      <CheckCircle2 size={17} />
                      <span>{isFinishing ? 'Salvando...' : 'Declarar como pronta (Concluir)'}</span>
                    </button>
                    <label className="stop-upload-photo-label" title="Anexar foto de comprovação">
                      <Camera size={16} />
                      <span>{completionPhotoPreview ? 'Foto anexada ✓' : 'Anexar foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>
                )}

                {currentStop.status === 'Finalizado' && (
                  <div className="stop-status-finished-badge">
                    <CheckCircle2 size={18} />
                    <div className="stop-finished-text">
                      <strong>Serviço finalizado com sucesso!</strong>
                      <span>A ocorrência foi reparada e notificada ao munícipe.</span>
                    </div>
                    {completedStopsCount < routeOrders.length && (
                      <button
                        type="button"
                        className="button-secondary button-small btn-next-pending"
                        onClick={handleJumpToNextPending}
                      >
                        Próxima pendente →
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="stop-active-actions">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${currentStop.latitude},${currentStop.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-secondary stop-action-btn"
                >
                  <Navigation size={16} /> Navegar GPS <ExternalLink size={14} />
                </a>
                <Link to={`/campo/ordens/${currentStop.id}`} className="button-secondary stop-action-btn">
                  <ClipboardList size={16} /> Laudo e fotos completas <ArrowRight size={14} />
                </Link>
              </div>

              <div className="stop-stepper-footer">
                <button
                  type="button"
                  className="stop-step-btn"
                  disabled={activeStopIndex === 0}
                  onClick={() => setActiveStopIndex((prev) => Math.max(0, prev - 1))}
                >
                  <ArrowLeft size={16} /> Parada anterior
                </button>
                <span className="stop-stepper-counter">
                  {activeStopIndex + 1} / {routeOrders.length}
                </span>
                <button
                  type="button"
                  className="stop-step-btn"
                  disabled={activeStopIndex === routeOrders.length - 1}
                  onClick={() => setActiveStopIndex((prev) => Math.min(routeOrders.length - 1, prev + 1))}
                >
                  Próxima parada <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : null}

          <div className="field-route-itinerary">
            <h3 className="itinerary-title">Sequência do itinerário</h3>
            <div className="itinerary-list">
              {routeOrders.map((order, index) => {
                const isActive = index === activeStopIndex
                const isDone = order.status === 'Finalizado'
                return (
                  <button
                    key={order.id}
                    type="button"
                    className={`itinerary-item ${isActive ? 'itinerary-item-active' : ''} ${isDone ? 'itinerary-item-done' : ''}`}
                    onClick={() => setActiveStopIndex(index)}
                  >
                    <span className={`itinerary-step-number ${isDone ? 'itinerary-step-done' : ''}`}>
                      {isDone ? '✓' : index + 1}
                    </span>
                    <div className="itinerary-item-content">
                      <div className="itinerary-item-topline">
                        <strong>{order.category}</strong>
                        <StatusBadge status={order.status} compact />
                      </div>
                      <p className="itinerary-item-addr">{order.address || order.region}</p>
                      <small className="itinerary-item-protocol">{order.protocol}</small>
                    </div>
                    <ChevronRight size={17} className="itinerary-arrow" />
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

