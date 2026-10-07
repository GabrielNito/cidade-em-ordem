'use client'

import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from '../../navigation'

export function PageHeader({
  eyebrow,
  title,
  description,
  backTo,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  backTo?: string
  action?: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <div className="page-header">
      <div className="page-header-main">
        {backTo ? (
          <button className="icon-button page-back-button" onClick={() => navigate(backTo)} aria-label="Voltar">
            <ArrowLeft size={19} />
          </button>
        ) : null}
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {description ? <p className="page-description">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  )
}
