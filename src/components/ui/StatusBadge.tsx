import type { ReportStatus } from '../../types/domain'
import { statusStyles } from '../../utils/report'

export function StatusBadge({ status, compact = false }: { status: ReportStatus; compact?: boolean }) {
  const style = statusStyles[status]
  return (
    <span className={`status-badge ${style.className} ${compact ? 'status-badge-compact' : ''}`}>
      <span className="status-dot" aria-hidden="true" />
      {style.label}
    </span>
  )
}
