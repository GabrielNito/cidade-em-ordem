import { MapPin } from 'lucide-react'
import { Link } from '../../navigation'
import type { Report } from '../../types/domain'
import { formatDate, formatShortDate } from '../../utils/report'
import { CategoryIcon } from '../ui/CategoryIcon'
import { StatusBadge } from '../ui/StatusBadge'

export function ReportCard({ report, detailPath, field = false }: { report: Report; detailPath: string; field?: boolean }) {
  return (
    <Link to={detailPath} className="report-card group">
      <CategoryIcon category={report.category} />
      <div className="report-card-content">
        <div className="report-card-topline">
          <h3>{report.category}</h3>
          <StatusBadge status={report.status} compact />
        </div>
        <p className="report-protocol">{report.protocol}</p>
        <div className="report-card-meta">
          <span className="meta-with-icon">
            <MapPin size={14} aria-hidden="true" />
            {report.region}
          </span>
          <span>{field ? formatDate(report.createdAt) : formatShortDate(report.createdAt)}</span>
        </div>
        {field && report.assignedTo ? <p className="assigned-mini">Responsável atribuído</p> : null}
      </div>
    </Link>
  )
}
