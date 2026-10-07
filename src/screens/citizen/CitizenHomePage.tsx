'use client'

import { ArrowRight, ClipboardList } from 'lucide-react'
import { Link } from '../../navigation'
import { useApp } from '../../context/AppContext'
import { ReportCard } from '../../components/reports/ReportCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatCount } from '../../utils/report'

export function CitizenHomePage() {
  const { reports, user } = useApp()
  const myReports = reports.filter((report) => report.citizen.id === user.id)
  const counts = {
    open: myReports.filter((report) => report.status === 'Aberto').length,
    progress: myReports.filter((report) => report.status === 'Em atendimento').length,
    done: myReports.filter((report) => report.status === 'Finalizado').length,
  }
  const recentReports = [...myReports].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3)

  return (
    <div className="content-stack">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">Área do cidadão</p>
          <h1>Olá, {user.name.split(' ')[0]}</h1>
          <p className="page-description">Acompanhe seus chamados de zeladoria urbana.</p>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Acompanhe de perto</p>
            <h2>Meus chamados</h2>
          </div>
          <Link to="/app/chamados" className="text-link">Ver todos <ArrowRight size={15} /></Link>
        </div>
        <div className="summary-grid">
          <div className="summary-card"><span>{formatCount(counts.open)}</span><small>Abertos</small></div>
          <div className="summary-card"><span>{formatCount(counts.progress)}</span><small>Em atendimento</small></div>
          <div className="summary-card"><span>{formatCount(counts.done)}</span><small>Finalizados</small></div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Atualizações</p>
            <h2>Chamados recentes</h2>
          </div>
        </div>
        {recentReports.length ? (
          <div className="report-list">
            {recentReports.map((report) => <ReportCard key={report.id} report={report} detailPath={`/app/chamados/${report.id}`} />)}
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title="Você ainda não tem chamados" description="Quando registrar uma ocorrência, ela aparecerá aqui para acompanhamento." action={<Link className="button-secondary button-small" to="/app/nova-ocorrencia">Registrar ocorrência</Link>} />
        )}
      </section>
    </div>
  )
}
