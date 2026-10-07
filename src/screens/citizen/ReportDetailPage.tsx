'use client'

import { ArrowLeft, CalendarDays, Camera, Clock3, MapPin, UserRound } from 'lucide-react'
import { Link, useNavigate, useParams } from '../../navigation'
import { IssueMap } from '../../components/maps/IssueMap'
import { StatusTimeline } from '../../components/reports/StatusTimeline'
import { ConfirmationButton } from '../../components/reports/ConfirmationButton'
import { CategoryIcon } from '../../components/ui/CategoryIcon'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { PhotoFrame } from '../../components/ui/PhotoFrame'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { getCrewMember } from '../../data/crew'
import { useApp } from '../../context/AppContext'
import { formatCoordinates, formatDateTime } from '../../utils/report'

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { reports, user, role, confirmReport } = useApp()
  const report = reports.find((item) => item.id === id)

  if (!report) {
    return <EmptyState icon={MapPin} title="Chamado não encontrado" description="Este registro pode ter sido removido ou o link está incorreto." action={<Link to="/app/chamados" className="button-secondary button-small">Voltar aos chamados</Link>} />
  }

  const assigned = getCrewMember(report.assignedTo)
  return (
    <div className="content-stack detail-page">
      <PageHeader eyebrow={report.protocol} title={report.category} description={report.region} backTo="/app/chamados" action={<StatusBadge status={report.status} />} />
      <div className="detail-photo-grid">
        <PhotoFrame src={report.photo} category={report.category} alt={`Fotografia enviada para o chamado ${report.protocol}`} className="detail-main-photo" />
        <div className="detail-intro-card">
          <div className="detail-category-line"><CategoryIcon category={report.category} /><span>Registro do cidadão</span></div>
          <p>{report.description}</p>
          <div className="detail-info-list">
            <div><CalendarDays size={16} /><span><small>Aberto em</small><strong>{formatDateTime(report.createdAt)}</strong></span></div>
            <div><MapPin size={16} /><span><small>Localização</small><strong>{report.address || report.region}</strong><em>{formatCoordinates(report.latitude, report.longitude)}</em></span></div>
            {assigned ? <div><UserRound size={16} /><span><small>Responsável</small><strong>{assigned.name}</strong><em>{assigned.specialty}</em></span></div> : null}
          </div>
        </div>
      </div>
      <section className="detail-section confirmation-detail-section">
        <div className="detail-section-heading"><div><p className="eyebrow">Participação cidadã</p><h2>Este problema também acontece com você?</h2></div></div>
        <ConfirmationButton report={report} userId={user.id} role={role} onConfirm={confirmReport} />
      </section>
      <section className="detail-section detail-progress-section">
        <div className="detail-section-heading"><div><p className="eyebrow">Acompanhe o serviço</p><h2>Andamento do chamado</h2></div><Clock3 size={21} aria-hidden="true" /></div>
        <StatusTimeline status={report.status} />
      </section>
      <section className="detail-section">
        <div className="detail-section-heading"><div><p className="eyebrow">Ponto informado</p><h2>Localização da ocorrência</h2></div></div>
        <IssueMap reports={[report]} selectedId={report.id} className="map-detail" />
      </section>
      {report.status === 'Finalizado' && report.completionPhoto ? (
        <section className="detail-section completion-section">
          <div className="detail-section-heading"><div><p className="eyebrow">Serviço concluído</p><h2>Resultado registrado pela equipe</h2></div><Camera size={21} aria-hidden="true" /></div>
          <PhotoFrame src={report.completionPhoto} category={report.category} alt={`Fotografia da conclusão do chamado ${report.protocol}`} className="completion-photo" />
          {report.finishedAt ? <p className="completion-date">Finalizado em {formatDateTime(report.finishedAt)}</p> : null}
        </section>
      ) : null}
      <button className="button-secondary detail-back-button" onClick={() => navigate('/app/chamados')}><ArrowLeft size={17} /> Voltar aos meus chamados</button>
    </div>
  )
}
