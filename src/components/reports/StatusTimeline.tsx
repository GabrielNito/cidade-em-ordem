import { Check } from 'lucide-react'
import type { ReportStatus } from '../../types/domain'
import { STATUS_ORDER } from '../../utils/report'

const statusExplanation: Record<ReportStatus, string> = {
  Aberto: 'Recebido pela Prefeitura',
  'Em atendimento': 'Equipe responsável acionada',
  Finalizado: 'Serviço concluído',
}

export function StatusTimeline({ status }: { status: ReportStatus }) {
  const currentIndex = Math.max(0, STATUS_ORDER.indexOf(status))
  const progressPercent = currentIndex === 0 ? 0 : currentIndex === 1 ? 50 : 100

  return (
    <div className="status-timeline" aria-label={`Andamento: ${status}`}>
      <div className="status-timeline-track" aria-hidden="true">
        <div className="status-timeline-track-fill" style={{ width: `${progressPercent}%` }} />
      </div>
      {STATUS_ORDER.map((step, index) => {
        const reached = index <= currentIndex
        const isCurrent = index === currentIndex
        return (
          <div
            key={step}
            className={`timeline-step ${reached ? 'timeline-step-reached' : ''} ${isCurrent ? 'timeline-step-current' : ''}`}
          >
            <span className="timeline-marker" aria-hidden="true">
              {reached ? <Check size={14} strokeWidth={2.5} /> : index + 1}
            </span>
            <div className="timeline-step-content">
              <strong>{step}</strong>
              <small>{statusExplanation[step]}</small>
            </div>
          </div>
        )
      })}
    </div>
  )
}
