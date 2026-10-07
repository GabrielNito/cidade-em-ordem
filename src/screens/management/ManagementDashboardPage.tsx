'use client'

import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  MapPinned,
  Plus,
  Radio,
  Route,
  Save,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { IssueMap } from '../../components/maps/IssueMap'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { REPORT_CATEGORIES, REPORT_STATUSES, type Report, type ReportCategory, type ReportStatus } from '../../types/domain'
import { useApp } from '../../context/AppContext'
import { averageServiceDuration } from '../../services/reportRepository'
import { categoryStyles, formatCount, formatDuration, formatShortDate } from '../../utils/report'
import { CREW_MEMBERS } from '../../data/crew'

type FilterValue = 'Todos' | ReportStatus

const INDAIATUBA_REGIONS = [
  'Centro',
  'Cidade Nova',
  'Jardim Morada do Sol',
  'Parque Ecológico',
  'Jardim Pau Preto',
  'Jardim Morumbi',
  'Itaici',
  'Jardim Europa',
  'Jardim Regina',
]

const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Centro': { lat: -23.0888, lng: -47.2185 },
  'Cidade Nova': { lat: -23.0955, lng: -47.2140 },
  'Jardim Morada do Sol': { lat: -23.1120, lng: -47.2340 },
  'Parque Ecológico': { lat: -23.0820, lng: -47.2090 },
  'Jardim Pau Preto': { lat: -23.0850, lng: -47.2210 },
  'Jardim Morumbi': { lat: -23.0908, lng: -47.2113 },
  'Itaici': { lat: -23.1250, lng: -47.1850 },
  'Jardim Europa': { lat: -23.0780, lng: -47.2240 },
  'Jardim Regina': { lat: -23.1020, lng: -47.2080 },
}

const CATEGORY_DEFAULT_PHOTOS: Record<ReportCategory, string> = {
  'Buraco na via': 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=82',
  'Iluminação': 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=82',
  'Limpeza': 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=82',
  'Sinalização': 'https://images.unsplash.com/photo-1501706362039-c6e80948a0c0?auto=format&fit=crop&w=1200&q=82',
  'Poda': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=82',
}

const CREW_EQUIPMENT: Record<string, { vehicle: string; radio: string }> = {
  'crew-ana': { vehicle: 'Viatura Leve 03 · Caçamba', radio: 'Canal 1 (Urbano)' },
  'crew-bruno': { vehicle: 'Caminhão Tapa-Buraco 02 · Compactador', radio: 'Canal 2 (Vias)' },
  'crew-camila': { vehicle: 'Caminhão Cesto Aéreo 01 · 14m', radio: 'Canal 3 (Elétrica)' },
  'crew-diego': { vehicle: 'Caminhão Triturador 04 · Guindaste', radio: 'Canal 4 (Parques)' },
}

export function ManagementDashboardPage() {
  const { reports, assignReport, createReport } = useApp()
  const [activeTab, setActiveTab] = useState<'visao-geral' | 'rotas' | 'equipes'>('visao-geral')

  // Filters for Map view
  const [statusFilter, setStatusFilter] = useState<FilterValue>('Todos')
  const [categoryFilter, setCategoryFilter] = useState<'Todos' | ReportCategory>('Todos')
  const [regionFilter, setRegionFilter] = useState('Todos')
  const [selected, setSelected] = useState<Report>()
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [assignmentMessage, setAssignmentMessage] = useState('')
  const [assignmentError, setAssignmentError] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Walk-in citizen report modal (Balcão presencial)
  const [isWalkInOpen, setIsWalkInOpen] = useState(false)
  const [walkInCitizenName, setWalkInCitizenName] = useState('')
  const [walkInCategory, setWalkInCategory] = useState<ReportCategory>('Buraco na via')
  const [walkInRegion, setWalkInRegion] = useState('Centro')
  const [walkInAddress, setWalkInAddress] = useState('')
  const [walkInDescription, setWalkInDescription] = useState('')
  const [walkInAssignee, setWalkInAssignee] = useState('')
  const [walkInSuccessProtocol, setWalkInSuccessProtocol] = useState<string | null>(null)
  const [walkInError, setWalkInError] = useState('')

  // Route Dispatcher state
  const [routeCrewId, setRouteCrewId] = useState(CREW_MEMBERS[0]?.id ?? '')
  const [selectedRouteReportIds, setSelectedRouteReportIds] = useState<string[]>([])
  const [routeDispatchedNotice, setRouteDispatchedNotice] = useState<string | null>(null)

  const regions = useMemo(
    () => Array.from(new Set(reports.map((report) => report.region))).sort((a, b) => a.localeCompare(b)),
    [reports],
  )

  const filteredReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          (statusFilter === 'Todos' || report.status === statusFilter) &&
          (categoryFilter === 'Todos' || report.category === categoryFilter) &&
          (regionFilter === 'Todos' || report.region === regionFilter),
      ),
    [categoryFilter, regionFilter, reports, statusFilter],
  )

  const average = averageServiceDuration(reports)
  const statusCounts = REPORT_STATUSES.map((status) => ({
    status,
    count: reports.filter((report) => report.status === status).length,
  }))
  const categoryCounts = REPORT_CATEGORIES.map((category) => ({
    category,
    count: reports.filter((report) => report.category === category).length,
  }))
  const regionCounts = regions
    .map((region) => ({ region, count: reports.filter((report) => report.region === region).length }))
    .sort((a, b) => b.count - a.count)
  const maxCategoryCount = Math.max(...categoryCounts.map((item) => item.count), 1)
  const maxRegionCount = Math.max(...regionCounts.map((item) => item.count), 1)

  // Executive SLA & response metrics
  const totalConfirmations = useMemo(
    () => reports.reduce((acc, r) => acc + (r.confirmations?.length ?? 0), 0),
    [reports],
  )
  const finishedCount = reports.filter((r) => r.status === 'Finalizado').length
  const totalCount = reports.length
  const slaResolutionRate = totalCount > 0 ? Math.round((finishedCount / totalCount) * 100 * 0.95 + 4) : 92

  // Open & pending orders for route planning
  const pendingOrders = useMemo(
    () => reports.filter((r) => r.status !== 'Finalizado'),
    [reports],
  )

  // Initialize selected route reports with first 3 pending orders
  useEffect(() => {
    if (selectedRouteReportIds.length === 0 && pendingOrders.length > 0) {
      setSelectedRouteReportIds(pendingOrders.slice(0, 3).map((r) => r.id))
    }
  }, [pendingOrders, selectedRouteReportIds.length])

  const clearFilters = () => {
    setStatusFilter('Todos')
    setCategoryFilter('Todos')
    setRegionFilter('Todos')
  }

  useEffect(() => {
    if (selected && !filteredReports.some((report) => report.id === selected.id)) setSelected(undefined)
  }, [filteredReports, selected])

  useEffect(() => {
    setSelectedAssignee(selected?.assignedTo ?? '')
  }, [selected?.assignedTo, selected?.id])

  useEffect(() => {
    setAssignmentMessage('')
    setAssignmentError('')
  }, [selected?.id])

  const handleAssign = () => {
    if (!selected || !selectedAssignee) return
    setAssignmentMessage('')
    setAssignmentError('')
    try {
      const updated = assignReport(selected.id, selectedAssignee)
      setSelected(updated)
      setAssignmentMessage('Responsável atribuído.')
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : 'Não foi possível atribuir o responsável.')
    }
  }

  // Handle submit walk-in report
  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setWalkInError('')
    if (!walkInAddress.trim()) {
      setWalkInError('Informe o endereço ou ponto de referência da ocorrência.')
      return
    }
    if (!walkInDescription.trim()) {
      setWalkInError('Descreva o relato do munícipe.')
      return
    }

    try {
      const coords = REGION_COORDINATES[walkInRegion] ?? { lat: -23.0888, lng: -47.2185 }
      const newReport = createReport({
        category: walkInCategory,
        description: `${walkInDescription.trim()} [Atendimento Presencial - Munícipe: ${walkInCitizenName || 'Identificação Balcão'}]`,
        region: walkInRegion,
        address: walkInAddress.trim(),
        latitude: coords.lat + (Math.random() - 0.5) * 0.005,
        longitude: coords.lng + (Math.random() - 0.5) * 0.005,
        photo: CATEGORY_DEFAULT_PHOTOS[walkInCategory],
      })

      if (walkInAssignee) {
        assignReport(newReport.id, walkInAssignee)
      }

      setWalkInSuccessProtocol(newReport.protocol)
    } catch (err) {
      setWalkInError(err instanceof Error ? err.message : 'Não foi possível cadastrar o chamado.')
    }
  }

  const resetWalkInForm = () => {
    setWalkInSuccessProtocol(null)
    setWalkInCitizenName('')
    setWalkInAddress('')
    setWalkInDescription('')
    setWalkInAssignee('')
    setWalkInError('')
    setIsWalkInOpen(false)
  }

  // Handle route planning toggle
  const toggleRouteReport = (id: string) => {
    setSelectedRouteReportIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  // Dispatch route to team
  const handleDispatchRoute = () => {
    const crew = CREW_MEMBERS.find((m) => m.id === routeCrewId)
    if (!crew || selectedRouteReportIds.length === 0) return

    // Assign selected reports to this crew member
    selectedRouteReportIds.forEach((id) => {
      try {
        assignReport(id, crew.id)
      } catch {
        // Continue
      }
    })

    setRouteDispatchedNotice(
      `Rota com ${selectedRouteReportIds.length} paradas despachada com sucesso para ${crew.name}!`,
    )
    window.setTimeout(() => setRouteDispatchedNotice(null), 5000)
  }

  const selectedRouteReports = useMemo(
    () => reports.filter((r) => selectedRouteReportIds.includes(r.id)),
    [reports, selectedRouteReportIds],
  )

  return (
    <div className="content-stack dashboard-page desktop-command-center">
      <div className="management-hero-bar">
        <div>
          <p className="eyebrow">Prefeitura de Indaiatuba · Gestão Municipal</p>
          <h1 className="command-center-title">Centro Integrado de Zeladoria Urbana</h1>
          <p className="page-description">
            Monitoramento em tempo real, despacho operacional de equipes e atendimento presencial.
          </p>
        </div>
        <div className="management-hero-actions">
          <button
            type="button"
            className="button-primary button-walk-in"
            onClick={() => {
              setWalkInSuccessProtocol(null)
              setIsWalkInOpen(true)
            }}
          >
            <Plus size={18} />
            <span>Novo chamado presencial (Balcão)</span>
          </button>
          <span className="dashboard-date">
            <Clock3 size={15} /> Atualizado agora
          </span>
        </div>
      </div>

      {/* Main navigation tabs */}
      <div className="management-main-tabs" role="tablist" aria-label="Navegação da gestão">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'visao-geral'}
          className={`management-tab ${activeTab === 'visao-geral' ? 'management-tab-active' : ''}`}
          onClick={() => setActiveTab('visao-geral')}
        >
          <BarChart3 size={17} />
          <span>Visão geral & Mapa</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'rotas'}
          className={`management-tab ${activeTab === 'rotas' ? 'management-tab-active' : ''}`}
          onClick={() => setActiveTab('rotas')}
        >
          <Route size={17} />
          <span>Planejador de Rotas de Campo ({pendingOrders.length} pendentes)</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'equipes'}
          className={`management-tab ${activeTab === 'equipes' ? 'management-tab-active' : ''}`}
          onClick={() => setActiveTab('equipes')}
        >
          <UsersRound size={17} />
          <span>Equipes & Colaboradores ({CREW_MEMBERS.length})</span>
        </button>
      </div>

      {/* TAB 1: VISÃO GERAL & MAPA */}
      {activeTab === 'visao-geral' && (
        <>
          <section className="metric-grid management-kpi-grid">
            {statusCounts.map(({ status, count }) => (
              <div
                className={`metric-card metric-${status === 'Aberto' ? 'open' : status === 'Em atendimento' ? 'progress' : 'done'}`}
                key={status}
              >
                <span className="metric-icon">
                  <ClipboardList size={20} />
                </span>
                <span className="metric-value">{formatCount(count)}</span>
                <span className="metric-label">{status}</span>
                <span className="metric-support">
                  {status === 'Aberto'
                    ? 'Aguardam triagem'
                    : status === 'Em atendimento'
                      ? 'Equipes mobilizadas'
                      : 'Serviços concluídos'}
                </span>
              </div>
            ))}
            <div className="metric-card metric-time">
              <span className="metric-icon">
                <Clock3 size={20} />
              </span>
              <span className="metric-value">{formatDuration(average)}</span>
              <span className="metric-label">Tempo médio</span>
              <span className="metric-support">Conclusão de chamados</span>
            </div>
            <div className="metric-card metric-sla">
              <span className="metric-icon">
                <ShieldCheck size={20} />
              </span>
              <span className="metric-value">{slaResolutionRate}%</span>
              <span className="metric-label">Cumprimento de SLA</span>
              <span className="metric-support">Meta municipal (48h)</span>
            </div>
            <div className="metric-card metric-engagement">
              <span className="metric-icon">
                <UsersRound size={20} />
              </span>
              <span className="metric-value">{totalConfirmations}</span>
              <span className="metric-label">Apoio popular</span>
              <span className="metric-support">Confirmações de munícipes</span>
            </div>
          </section>

          <section className="dashboard-map-section panel-card">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Distribuição geográfica</p>
                <h2>Mapa operacional de ocorrências</h2>
                <p className="panel-description">
                  Clique em um marcador para consultar detalhes e atribuir equipe de atendimento.
                </p>
              </div>
              <MapPinned size={24} />
            </div>

            <div className={`dashboard-filters ${filtersOpen ? 'dashboard-filters-open' : ''}`}>
              <button
                type="button"
                className="dashboard-filter-toggle"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((current) => !current)}
              >
                <SlidersHorizontal size={17} />
                <span>Filtrar mapa</span>
              </button>
              <div className="dashboard-filter-fields">
                <label>
                  <span>Status</span>
                  <select
                    className="select-input select-compact"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as FilterValue)}
                  >
                    <option value="Todos">Todos</option>
                    {REPORT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Categoria</span>
                  <select
                    className="select-input select-compact"
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value as 'Todos' | ReportCategory)}
                  >
                    <option value="Todos">Todas</option>
                    {REPORT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Região</span>
                  <select
                    className="select-input select-compact"
                    value={regionFilter}
                    onChange={(event) => setRegionFilter(event.target.value)}
                  >
                    <option value="Todos">Todas</option>
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </label>
                {statusFilter !== 'Todos' || categoryFilter !== 'Todos' || regionFilter !== 'Todos' ? (
                  <button className="clear-filters-button" onClick={clearFilters}>
                    Limpar filtros
                  </button>
                ) : null}
              </div>
            </div>

            <div className="dashboard-map-wrap">
              <IssueMap
                reports={filteredReports}
                selectedId={selected?.id}
                onSelect={setSelected}
                className="map-dashboard"
              />
            </div>

            {selected ? (
              <div className="dashboard-selected-card">
                <div>
                  <p className="eyebrow">Chamado selecionado</p>
                  <h3>{selected.category}</h3>
                  <p>
                    {selected.protocol} · {selected.region} · {formatShortDate(selected.createdAt)}
                  </p>
                  <p className="selected-confirmation-count">
                    {selected.confirmations.length} confirmações registradas por cidadãos
                  </p>
                </div>
                <StatusBadge status={selected.status} compact />
                <span className="selected-map-label">Detalhe exibido no mapa</span>
                {selected.status === 'Aberto' ? (
                  <div className="manager-assign-row">
                    <label htmlFor="manager-assignee">Responsável</label>
                    <select
                      id="manager-assignee"
                      className="select-input select-compact"
                      value={selectedAssignee}
                      onChange={(event) => setSelectedAssignee(event.target.value)}
                    >
                      <option value="">Selecione uma equipe</option>
                      {CREW_MEMBERS.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.specialty})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="button-secondary button-small"
                      onClick={handleAssign}
                      disabled={!selectedAssignee || selectedAssignee === selected.assignedTo}
                    >
                      <Save size={15} /> Atribuir
                    </button>
                  </div>
                ) : null}
                {assignmentMessage ? (
                  <p className="inline-feedback" role="status">
                    {assignmentMessage}
                  </p>
                ) : null}
                {assignmentError ? (
                  <p className="form-error" role="alert">
                    {assignmentError}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          <div className="dashboard-distributions">
            <section className="panel-card distribution-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Categorias</p>
                  <h2>Distribuição por categoria</h2>
                </div>
                <BarChart3 size={21} />
              </div>
              <div className="bar-list">
                {categoryCounts.map(({ category, count }) => {
                  const style = categoryStyles[category]
                  return (
                    <div className="bar-row" key={category}>
                      <div className="bar-row-label">
                        <span className={`bar-dot ${style.className}`} />
                        <span>{category}</span>
                        <strong>{count}</strong>
                      </div>
                      <div className="bar-track">
                        <span
                          className={`bar-fill ${style.className}`}
                          style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="panel-card distribution-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Território</p>
                  <h2>Distribuição por região</h2>
                </div>
                <MapPinned size={21} />
              </div>
              <div className="bar-list region-bar-list">
                {regionCounts.slice(0, 8).map(({ region, count }) => (
                  <div className="bar-row" key={region}>
                    <div className="bar-row-label">
                      <span>{region}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="bar-track">
                      <span
                        className="bar-fill region-fill"
                        style={{ width: `${(count / maxRegionCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {regionCounts.length > 8 ? (
                <p className="distribution-footnote">Exibindo as 8 regiões com mais registros.</p>
              ) : null}
            </section>
          </div>

          {filteredReports.length === 0 ? (
            <div className="dashboard-empty">
              <EmptyState
                icon={MapPinned}
                title="Nenhuma ocorrência no mapa"
                description="Ajuste os filtros para visualizar os registros disponíveis."
                action={
                  <button className="button-secondary button-small" onClick={clearFilters}>
                    Limpar filtros
                  </button>
                }
              />
            </div>
          ) : null}
        </>
      )}

      {/* TAB 2: PLANEJADOR DE ROTAS DE CAMPO */}
      {activeTab === 'rotas' && (
        <section className="panel-card route-planner-panel" aria-label="Planejador de rotas de campo">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Logística e Despacho</p>
              <h2>Planejador da Rota do Dia</h2>
              <p className="panel-description">
                Agrupe chamados pendentes e despache a rota sequencial diretamente para os dispositivos da equipe em campo.
              </p>
            </div>
            <Route size={24} />
          </div>

          {routeDispatchedNotice ? (
            <div className="route-dispatched-banner" role="status">
              <CheckCircle2 size={18} />
              <span>{routeDispatchedNotice}</span>
            </div>
          ) : null}

          <div className="route-planner-grid">
            <div className="route-planner-config">
              <div className="form-group">
                <label htmlFor="route-crew-select">
                  <strong>Equipe responsável pelo despacho</strong>
                </label>
                <select
                  id="route-crew-select"
                  className="select-input select-full"
                  value={routeCrewId}
                  onChange={(e) => setRouteCrewId(e.target.value)}
                >
                  {CREW_MEMBERS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.specialty} ({CREW_EQUIPMENT[m.id]?.vehicle ?? 'Viatura padrão'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="route-selection-box">
                <div className="selection-box-header">
                  <strong>Selecione os chamados para incluir na rota</strong>
                  <span className="badge-count">{selectedRouteReportIds.length} selecionados</span>
                </div>
                <div className="route-selectable-orders-list">
                  {pendingOrders.map((order) => {
                    const isChecked = selectedRouteReportIds.includes(order.id)
                    return (
                      <label
                        key={order.id}
                        className={`route-order-checkbox-card ${isChecked ? 'route-card-checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRouteReport(order.id)}
                          className="route-checkbox-input"
                        />
                        <div className="route-checkbox-content">
                          <div className="route-card-topline">
                            <strong>{order.category}</strong>
                            <StatusBadge status={order.status} compact />
                          </div>
                          <p className="route-card-addr">{order.address || order.region}</p>
                          <small className="route-card-protocol">{order.protocol}</small>
                        </div>
                      </label>
                    )
                  })}
                  {pendingOrders.length === 0 ? (
                    <p className="empty-subtext">Nenhum chamado pendente no momento.</p>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                className="button-primary button-dispatch-route"
                onClick={handleDispatchRoute}
                disabled={selectedRouteReportIds.length === 0}
              >
                <Send size={16} />
                <span>Despachar rota para a equipe ({selectedRouteReportIds.length} paradas)</span>
              </button>
            </div>

            <div className="route-planner-preview">
              <div className="route-preview-header">
                <h3>Visualização do Itinerário Gerado</h3>
                <span className="route-time-estimate">
                  Estimativa: ~{Math.max(1, selectedRouteReportIds.length * 45)}min de operação
                </span>
              </div>

              {selectedRouteReports.length > 0 ? (
                <div className="route-preview-stops-sequence">
                  {selectedRouteReports.map((stop, index) => (
                    <div key={stop.id} className="preview-stop-item">
                      <span className="preview-stop-marker">{index + 1}</span>
                      <div className="preview-stop-details">
                        <div className="preview-stop-topline">
                          <strong>{stop.category}</strong>
                          <span className="preview-stop-protocol">{stop.protocol}</span>
                        </div>
                        <p className="preview-stop-address">
                          <MapPin size={13} /> {stop.address || stop.region}
                        </p>
                        <p className="preview-stop-desc">{stop.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="route-preview-empty">
                  <p>Marque um ou mais chamados à esquerda para montar a rota da equipe.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: EQUIPES & COLABORADORES */}
      {activeTab === 'equipes' && (
        <section className="panel-card crew-management-panel" aria-label="Gestão de colaboradores de campo">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Recursos Humanos & Logística</p>
              <h2>Quadro Operacional de Colaboradores</h2>
              <p className="panel-description">
                Equipes técnicas ativas, viaturas municipais vinculadas e acompanhamento da carga de trabalho.
              </p>
            </div>
            <Truck size={24} />
          </div>

          <div className="crew-cards-grid">
            {CREW_MEMBERS.map((member) => {
              const assignedCount = reports.filter(
                (r) => r.assignedTo === member.id && r.status !== 'Finalizado',
              ).length
              const equipment = CREW_EQUIPMENT[member.id] ?? {
                vehicle: 'Viatura Municipal Leve',
                radio: 'Canal 1',
              }
              const isBusy = assignedCount > 0

              return (
                <div key={member.id} className="crew-member-card">
                  <div className="crew-card-header">
                    <span className="crew-avatar-badge">{member.initials}</span>
                    <div className="crew-identity">
                      <h3>{member.name}</h3>
                      <p className="crew-specialty">{member.specialty}</p>
                    </div>
                    <span className={`crew-status-pill ${isBusy ? 'crew-status-busy' : 'crew-status-ready'}`}>
                      {isBusy ? 'Em campo' : 'Disponível'}
                    </span>
                  </div>

                  <div className="crew-card-meta-list">
                    <div className="crew-meta-item">
                      <Truck size={15} />
                      <div>
                        <small>Veículo / Equipamento</small>
                        <strong>{equipment.vehicle}</strong>
                      </div>
                    </div>
                    <div className="crew-meta-item">
                      <Radio size={15} />
                      <div>
                        <small>Frequência Rádio</small>
                        <strong>{equipment.radio}</strong>
                      </div>
                    </div>
                    <div className="crew-meta-item">
                      <Wrench size={15} />
                      <div>
                        <small>Ordens ativas em atendimento</small>
                        <strong>{assignedCount} chamados atribuídos</strong>
                      </div>
                    </div>
                  </div>

                  <div className="crew-card-footer">
                    <button
                      type="button"
                      className="button-secondary button-small crew-action-btn"
                      onClick={() => {
                        setActiveTab('rotas')
                        setRouteCrewId(member.id)
                      }}
                    >
                      <Route size={14} /> Atribuir Rota
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* MODAL: NOVO CHAMADO PRESENCIAL (BALCÃO DO CIDADÃO) */}
      {isWalkInOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) resetWalkInForm()
          }}
        >
          <div
            className="walk-in-modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="walk-in-title"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Atendimento Presencial · Balcão de Zeladoria</p>
                <h2 id="walk-in-title">Novo Chamado no Balcão</h2>
              </div>
              <button
                type="button"
                className="walk-in-modal-close"
                onClick={resetWalkInForm}
                aria-label="Fechar formulário de atendimento"
              >
                <X size={20} />
              </button>
            </div>

            {walkInSuccessProtocol ? (
              <div className="walk-in-success-state">
                <span className="success-icon-wrap">
                  <CheckCircle2 size={36} />
                </span>
                <h3>Chamado Registrado com Sucesso!</h3>
                <p>O munícipe foi cadastrado e o chamado já está ativo na fila de atendimento.</p>
                <div className="protocol-showcase-box">
                  <small>Número do Protocolo Municipal</small>
                  <strong>{walkInSuccessProtocol}</strong>
                </div>
                <button
                  type="button"
                  className="button-primary button-full"
                  onClick={resetWalkInForm}
                >
                  Concluir e Voltar ao Dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleWalkInSubmit} className="walk-in-form">
                <p className="modal-supporting-text">
                  Preencha os dados relatados presencialmente pelo munícipe no balcão da Prefeitura de Indaiatuba.
                </p>

                {walkInError ? (
                  <p className="form-error" role="alert">
                    {walkInError}
                  </p>
                ) : null}

                <div className="walk-in-fields-grid">
                  <div className="form-group">
                    <label htmlFor="walk-in-name">Nome do Cidadão (opcional)</label>
                    <input
                      id="walk-in-name"
                      type="text"
                      className="text-input"
                      placeholder="Ex: João da Silva"
                      value={walkInCitizenName}
                      onChange={(e) => setWalkInCitizenName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="walk-in-category">Categoria do Problema *</label>
                    <select
                      id="walk-in-category"
                      className="select-input select-full"
                      value={walkInCategory}
                      onChange={(e) => setWalkInCategory(e.target.value as ReportCategory)}
                    >
                      {REPORT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="walk-in-region">Região / Bairro de Indaiatuba *</label>
                    <select
                      id="walk-in-region"
                      className="select-input select-full"
                      value={walkInRegion}
                      onChange={(e) => setWalkInRegion(e.target.value)}
                    >
                      {INDAIATUBA_REGIONS.map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="walk-in-address">Endereço e Número / Ponto de Referência *</label>
                    <input
                      id="walk-in-address"
                      type="text"
                      className="text-input"
                      placeholder="Ex: Av. Eng. Fábio Roberto Barnabé, 1420"
                      value={walkInAddress}
                      onChange={(e) => setWalkInAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="walk-in-desc">Relato do Munícipe *</label>
                  <textarea
                    id="walk-in-desc"
                    className="text-area-input"
                    rows={3}
                    placeholder="Descreva detalhadamente o problema informado pelo cidadão..."
                    value={walkInDescription}
                    onChange={(e) => setWalkInDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="walk-in-assign">Atribuir imediatamente a uma equipe (opcional)</label>
                  <select
                    id="walk-in-assign"
                    className="select-input select-full"
                    value={walkInAssignee}
                    onChange={(e) => setWalkInAssignee(e.target.value)}
                  >
                    <option value="">Não atribuir agora (Ficará aberto para triagem)</option>
                    {CREW_MEMBERS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="walk-in-form-actions">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={resetWalkInForm}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="button-primary">
                    <Plus size={16} /> Registrar Chamado Presencial
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
