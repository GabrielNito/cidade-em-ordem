import { categoryStyles } from '../../utils/report'
import type { ReportCategory } from '../../types/domain'

export function CategoryIcon({ category, size = 'md' }: { category: ReportCategory; size?: 'sm' | 'md' | 'lg' }) {
  const style = categoryStyles[category]
  const Icon = style.icon
  return (
    <span className={`category-icon ${style.className} category-icon-${size}`} aria-hidden="true">
      <Icon size={size === 'lg' ? 24 : size === 'sm' ? 16 : 19} strokeWidth={1.8} />
    </span>
  )
}
