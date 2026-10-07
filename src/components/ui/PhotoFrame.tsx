import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'
import type { ReportCategory } from '../../types/domain'
import { categoryStyles } from '../../utils/report'
import { CategoryIcon } from './CategoryIcon'

export function PhotoFrame({
  src,
  category,
  alt,
  className = '',
}: {
  src?: string
  category: ReportCategory
  alt: string
  className?: string
}) {
  const [hasError, setHasError] = useState(false)
  const style = categoryStyles[category]

  useEffect(() => setHasError(false), [src])

  if (!src || hasError) {
    return (
      <div className={`photo-frame photo-frame-placeholder ${style.className} ${className}`}>
        <CategoryIcon category={category} size="lg" />
        <span className="photo-placeholder-label">
          <ImageOff size={14} aria-hidden="true" />
          Sem fotografia disponível
        </span>
      </div>
    )
  }

  return (
    <div className={`photo-frame ${className}`}>
      <img src={src} alt={alt} onError={() => setHasError(true)} />
    </div>
  )
}
