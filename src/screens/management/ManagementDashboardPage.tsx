'use client'

import { BarChart3, ClipboardList, Clock3, MapPinned, Save, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { IssueMap } from '../../components/maps/IssueMap'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { REPORT_CATEGORIES, REPORT_STATUSES, type Report, type ReportCategory, type ReportStatus } from '../../types/domain'
import { useApp } from '../../context/AppContext'
import { averageServiceDuration } from '../../services/reportRepository'
import { categoryStyles, formatCount, formatDuration, formatShortDate } from '../../utils/report'
import { CREW_MEMBERS } from '../../data/crew'

type FilterValue = 'Todos' | ReportStatus

export function ManagementDashboardPage() {
  const { reports, assignReport } = useApp()
  const [statusFilter, setStatusFilter] = useState<FilterValue>('Todos')
  const [categoryFilter, setCategoryFilter] = useState<'Todos' | ReportCategory>('Todos')
  const [regionFilter, setRegionFilter] = useState('Todos')
  const [selected, setSelected] = useState<Report>()
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [assignmentMessage, setAssignmentMessage] = useState('')
  const [assignmentError, setAssignmentError] = useState('')

  const regions = useMemo(() => Array.from(new Set(reports.map((report) => report.region))).sort((a, b) => a.localeCompare(b)), [reports])
  const filteredReports = useMemo(() => reports.filter((report) => (statusFilter === 'Todos' || report.status === statusFilter) && (categoryFilter === 'Todos' || report.category === categoryFilter) && (regionFilter === 'Todos' || report.region === regionFilter)), [categoryFilter, regionFilter, reports, statusFilter])
  const average = averageServiceDuration(reports)
  const statusCounts = REPORT_STATUSES.map((status) => ({ status, count: reports.filter((report) => report.status === status).length }))
  const categoryCounts = REPORT_CATEGORIES.map((category) => ({ category, count: reports.filter((report) => report.category === category).length }))
  const regionCounts = regions.map((region) => ({ region, count: reports.filter((report) => report.region === region).length })).sort((a, b) => b.count - a.count)
  const maxCategoryCount = Math.max(...categoryCounts.map((item) => item.count), 1)
  const maxRegionCount = Math.max(...regionCounts.map((item) => item.count), 1)

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

  return (
    <div className="content-stack dashboard-page">
      <PageHeader eyebrow="Visão geral" title="Dashboard de zeladoria" description="Acompanhe as ocorrências registradas em Indaiatuba e o andamento dos serviços." action={<span className="dashboard-date"><Clock3 size={15} /> Dados da demonstração</span>} />
      <section className="metric-grid">
        {statusCounts.map(({ status, count }) => <div className={`metric-card metric-${status === 'Aberto' ? 'open' : status === 'Em atendimento' ? 'progress' : 'done'}`} key={status}><span className="metric-icon"><ClipboardList size={19} /></span><span className="metric-value">{formatCount(count)}</span><span className="metric-label">{status}</span></div>)}
        <div className="metric-card metric-time"><span className="metric-icon"><Clock3 size={19} /></span><span className="metric-value">{formatDuration(average)}</span><span className="metric-label">Tempo médio de atendimento</span></div>
      </section>
      <section className="dashboard-map-section panel-card">
        <div className="panel-heading"><div><p className="eyebrow">Distribuição geográfica</p><h2>Mapa de chamados</h2><p className="panel-description">Clique em um marcador para consultar o resumo da ocorrência.</p></div><MapPinned size={22} /></div>
        <div className="dashboard-filters">
          <div className="filter-heading"><SlidersHorizontal size={16} /><span>Filtrar mapa</span></div>
          <label><span>Status</span><select className="select-input select-compact" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as FilterValue)}><option value="Todos">Todos</option>{REPORT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
          <label><span>Categoria</span><select className="select-input select-compact" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as 'Todos' | ReportCategory)}><option value="Todos">Todas</option>{REPORT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
          <label><span>Região</span><select className="select-input select-compact" value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}><option value="Todos">Todas</option>{regions.map((region) => <option key={region} value={region}>{region}</option>)}</select></label>
          {statusFilter !== 'Todos' || categoryFilter !== 'Todos' || regionFilter !== 'Todos' ? <button className="clear-filters-button" onClick={clearFilters}>Limpar</button> : null}
        </div>
        <div className="dashboard-map-wrap"><IssueMap reports={filteredReports} selectedId={selected?.id} onSelect={setSelected} className="map-dashboard" /></div>
        {selected ? <div className="dashboard-selected-card"><div><p className="eyebrow">Chamado selecionado</p><h3>{selected.category}</h3><p>{selected.protocol} · {selected.region} · {formatShortDate(selected.createdAt)}</p><p className="selected-confirmation-count">{selected.confirmations.length} confirmações registradas</p></div><StatusBadge status={selected.status} compact /><span className="selected-map-label">Detalhe exibido no mapa</span>{selected.status === 'Aberto' ? <div className="manager-assign-row"><label htmlFor="manager-assignee">Responsável</label><select id="manager-assignee" className="select-input select-compact" value={selectedAssignee} onChange={(event) => setSelectedAssignee(event.target.value)}><option value="">Selecione uma equipe</option>{CREW_MEMBERS.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select><button type="button" className="button-secondary button-small" onClick={handleAssign} disabled={!selectedAssignee || selectedAssignee === selected.assignedTo}><Save size={15} /> Atribuir</button></div> : null}{assignmentMessage ? <p className="inline-feedback" role="status">{assignmentMessage}</p> : null}{assignmentError ? <p className="form-error" role="alert">{assignmentError}</p> : null}</div> : null}
      </section>
      <div className="dashboard-distributions">
        <section className="panel-card distribution-panel"><div className="panel-heading"><div><p className="eyebrow">Categorias</p><h2>Distribuição por categoria</h2></div><BarChart3 size={21} /></div><div className="bar-list">{categoryCounts.map(({ category, count }) => { const style = categoryStyles[category]; return <div className="bar-row" key={category}><div className="bar-row-label"><span className={`bar-dot ${style.className}`} /><span>{category}</span><strong>{count}</strong></div><div className="bar-track"><span className={`bar-fill ${style.className}`} style={{ width: `${(count / maxCategoryCount) * 100}%` }} /></div></div> })}</div></section>
        <section className="panel-card distribution-panel"><div className="panel-heading"><div><p className="eyebrow">Território</p><h2>Distribuição por região</h2></div><MapPinned size={21} /></div><div className="bar-list region-bar-list">{regionCounts.slice(0, 8).map(({ region, count }) => <div className="bar-row" key={region}><div className="bar-row-label"><span>{region}</span><strong>{count}</strong></div><div className="bar-track"><span className="bar-fill region-fill" style={{ width: `${(count / maxRegionCount) * 100}%` }} /></div></div>)}</div>{regionCounts.length > 8 ? <p className="distribution-footnote">Exibindo as 8 regiões com mais registros.</p> : null}</section>
      </div>
      {filteredReports.length === 0 ? <div className="dashboard-empty"><EmptyState icon={MapPinned} title="Nenhuma ocorrência no mapa" description="Ajuste os filtros para visualizar os registros disponíveis." action={<button className="button-secondary button-small" onClick={clearFilters}>Limpar filtros</button>} /></div> : null}
    </div>
  )
}
