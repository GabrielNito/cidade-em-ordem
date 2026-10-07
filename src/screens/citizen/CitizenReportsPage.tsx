'use client'

import { ClipboardList, Filter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from '../../navigation'
import { ReportCard } from '../../components/reports/ReportCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { useApp } from '../../context/AppContext'
import type { ReportStatus } from '../../types/domain'

const filters: Array<'Todos' | ReportStatus> = ['Todos', 'Aberto', 'Em atendimento', 'Finalizado']

export function CitizenReportsPage() {
  const { reports, user } = useApp()
  const [filter, setFilter] = useState<(typeof filters)[number]>('Todos')
  const myReports = reports.filter((report) => report.citizen.id === user.id)
  const summary = {
    open: myReports.filter((report) => report.status === 'Aberto').length,
    progress: myReports.filter((report) => report.status === 'Em atendimento').length,
    done: myReports.filter((report) => report.status === 'Finalizado').length,
  }
  const filteredReports = useMemo(() => {
    return myReports
      .filter((report) => filter === 'Todos' || report.status === filter)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [filter, myReports])

  return (
    <div className="content-stack">
      <PageHeader eyebrow="Acompanhamento" title="Meus chamados" description="Veja o andamento das solicitações registradas por você." action={<Link to="/app/nova-ocorrencia" className="button-primary button-small desktop-only-action">Nova ocorrência</Link>} />
      <div className="summary-grid reports-summary" aria-label="Resumo dos meus chamados">
        <div className="summary-card"><span>{summary.open}</span><small>Abertos</small></div>
        <div className="summary-card"><span>{summary.progress}</span><small>Em atendimento</small></div>
        <div className="summary-card"><span>{summary.done}</span><small>Finalizados</small></div>
      </div>
      <div className="filter-tabs" role="tablist" aria-label="Filtrar chamados por status">
        {filters.map((item) => (
          <button key={item} role="tab" aria-selected={filter === item} className={filter === item ? 'filter-tab filter-tab-active' : 'filter-tab'} onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
      </div>
      {filteredReports.length ? (
        <div className="report-list">
          {filteredReports.map((report) => <ReportCard key={report.id} report={report} detailPath={`/app/chamados/${report.id}`} />)}
        </div>
      ) : (
        <EmptyState icon={filter === 'Todos' ? ClipboardList : Filter} title={filter === 'Todos' ? 'Nenhum chamado por aqui' : `Nenhum chamado ${filter.toLowerCase()}`} description={filter === 'Todos' ? 'Registre uma ocorrência para começar a acompanhar os serviços.' : 'Altere o filtro para consultar outros chamados.'} action={filter === 'Todos' ? <Link className="button-secondary button-small" to="/app/nova-ocorrencia">Nova ocorrência</Link> : undefined} />
      )}
    </div>
  )
}
