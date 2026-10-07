import { Check } from 'lucide-react'
import type { ReportStatus } from '../../types/domain'
import { STATUS_ORDER } from '../../utils/report'

export function StatusTimeline({ status }: { status: ReportStatus }) {
  const currentIndex = STATUS_ORDER.indexOf(status)
  return (
    <div className="status-timeline" aria-label={`Andamento: ${status}`}>
      {STATUS_ORDER.map((step, index) => {
        const reached = index <= currentIndex
        return (
          <div className="timeline-step-wrap" key={step}>
            <div className={`timeline-step ${reached ? 'timeline-step-reached' : ''}`}>
              <span className="timeline-marker">{reached ? <Check size={14} strokeWidth={2.5} /> : index + 1}</span>
              <span>{step}</span>
            </div>
            {index < STATUS_ORDER.length - 1 ? <span className={`timeline-line ${index < currentIndex ? 'timeline-line-reached' : ''}`} /> : null}
          </div>
        )
      })}
    </div>
  )
}
