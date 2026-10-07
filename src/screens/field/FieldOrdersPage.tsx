'use client'

import { ClipboardList, Filter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ReportCard } from '../../components/reports/ReportCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { useApp } from '../../context/AppContext'
import type { ReportStatus } from '../../types/domain'

const filters: Array<'Todos' | ReportStatus> = ['Todos', 'Aberto', 'Em atendimento', 'Finalizado']

export function FieldOrdersPage() {
  const { reports } = useApp()
  const [filter, setFilter] = useState<(typeof filters)[number]>('Todos')
  const visibleReports = useMemo(() => reports.filter((report) => filter === 'Todos' || report.status === filter).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [filter, reports])

  return (
    <div className="content-stack">
      <PageHeader eyebrow="Operação" title="Ordens de serviço" description="Acompanhe os chamados que precisam de atendimento em campo." action={<span className="field-counter"><ClipboardList size={16} /> {reports.length} registros</span>} />
      <div className="filter-tabs field-filter-tabs" role="tablist" aria-label="Filtrar ordens por status">
        {filters.map((item) => <button key={item} role="tab" aria-selected={filter === item} className={filter === item ? 'filter-tab filter-tab-active' : 'filter-tab'} onClick={() => setFilter(item)}>{item}</button>)}
      </div>
      {visibleReports.length ? <div className="report-list">{visibleReports.map((report) => <ReportCard key={report.id} report={report} detailPath={`/campo/ordens/${report.id}`} field />)}</div> : <EmptyState icon={filter === 'Todos' ? ClipboardList : Filter} title="Nenhuma ordem neste filtro" description="Quando houver registros correspondentes, eles aparecerão aqui." action={<button className="button-secondary button-small" onClick={() => setFilter('Todos')}>Limpar filtro</button>} />}
    </div>
  )
}
