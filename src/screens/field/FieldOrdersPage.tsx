'use client'

import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, ClipboardList, ExternalLink, Filter, MapPin, Navigation, Route, Wrench } from 'lucide-react'
import { useMemo, useState } from 'react'
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

export function FieldOrdersPage() {
  const { reports } = useApp()
  const [viewMode, setViewMode] = useState<'lista' | 'rota'>('lista')
  const [filter, setFilter] = useState<(typeof filters)[number]>('Todos')
  const [activeStopIndex, setActiveStopIndex] = useState(0)

  const visibleReports = useMemo(
    () => reports.filter((report) => filter === 'Todos' || report.status === filter).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [filter, reports],
  )

  // Daily route stops: prioritized active orders (open & in progress), or all if none pending
  const routeOrders = useMemo(() => {
    const active = reports.filter((r) => r.status !== 'Finalizado')
    return active.length > 0 ? active : reports
  }, [reports])

  const currentStop: Report | undefined = routeOrders[activeStopIndex] ?? routeOrders[0]

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
              <p className="eyebrow">Itinerário otimizado</p>
              <h2>Rota operacional de hoje</h2>
            </div>
            <span className="route-total-badge">
              <CheckCircle2 size={16} /> {routeOrders.length} paradas programadas
            </span>
          </div>

          <div className="field-route-map-card">
            <IssueMap
              reports={routeOrders}
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

              <div className="stop-active-actions">
                <Link to={`/campo/ordens/${currentStop.id}`} className="button-primary stop-action-btn">
                  <Wrench size={16} /> Atender chamado <ArrowRight size={15} />
                </Link>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${currentStop.latitude},${currentStop.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-secondary stop-action-btn"
                >
                  <Navigation size={16} /> Navegar GPS <ExternalLink size={14} />
                </a>
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
                return (
                  <button
                    key={order.id}
                    type="button"
                    className={`itinerary-item ${isActive ? 'itinerary-item-active' : ''}`}
                    onClick={() => setActiveStopIndex(index)}
                  >
                    <span className="itinerary-step-number">{index + 1}</span>
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

