'use client'

import { ArrowRight, CalendarDays, MapPin, UsersRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConfirmationButton } from '../reports/ConfirmationButton'
import { StatusTimeline } from '../reports/StatusTimeline'
import { CategoryIcon } from '../ui/CategoryIcon'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHandle, DrawerTitle } from '../ui/drawer'
import { PhotoFrame } from '../ui/PhotoFrame'
import { StatusBadge } from '../ui/StatusBadge'
import type { Report, UserRole } from '../../types/domain'
import { formatCoordinates, formatDateTime } from '../../utils/report'

export function OccurrenceDrawer({
  report,
  userId,
  role,
  onConfirm,
  onClose,
  onViewDetails,
}: {
  report: Report
  userId: string
  role: UserRole
  onConfirm: (id: string) => void
  onClose: () => void
  onViewDetails: () => void
}) {
  const [activeSnapPoint, setActiveSnapPoint] = useState<number | string | null>(1)

  useEffect(() => {
    setActiveSnapPoint(1)
  }, [report.id])

  return (
    <Drawer
      open
      modal
      fixed
      closeThreshold={0.35}
      snapPoints={[0.62, 1]}
      fadeFromIndex={1}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={setActiveSnapPoint}
      onOpenChange={(open) => { if (!open) onClose() }}
    >
      <DrawerContent className="occurrence-drawer-content">
        <DrawerHandle className="occurrence-drawer-handle" />
        <div className="occurrence-drawer-scroll">
          <header className="occurrence-drawer-header">
            <div className="occurrence-drawer-title-row">
              <span className="occurrence-drawer-category-icon"><CategoryIcon category={report.category} /></span>
              <div>
                <p className="eyebrow">Ocorrência no mapa</p>
                <DrawerTitle id="occurrence-drawer-title">{report.category}</DrawerTitle>
                <DrawerDescription>{report.protocol}</DrawerDescription>
              </div>
            </div>
            <DrawerClose asChild>
              <button type="button" className="occurrence-drawer-close" onClick={onClose} aria-label="Fechar detalhes da ocorrência">
                <X size={19} />
              </button>
            </DrawerClose>
          </header>

          <div className="occurrence-drawer-status-row">
            <StatusBadge status={report.status} compact />
            <span><MapPin size={14} aria-hidden="true" /> {report.address || report.region}</span>
          </div>

          <PhotoFrame
            src={report.photo}
            category={report.category}
            alt={`Fotografia da ocorrência ${report.protocol}`}
            className="occurrence-drawer-photo"
          />

          <section className="occurrence-drawer-description" aria-labelledby="occurrence-description-title">
            <p id="occurrence-description-title" className="eyebrow">Relato do cidadão</p>
            <p>{report.description}</p>
          </section>

          <div className="occurrence-drawer-info-grid">
            <div>
              <span>Protocolo</span>
              <strong>{report.protocol}</strong>
            </div>
            <div>
              <span>Confirmações</span>
              <strong><UsersRound size={15} aria-hidden="true" /> {report.confirmations?.length ?? 0}</strong>
            </div>
            <div>
              <span>Registrado em</span>
              <strong><CalendarDays size={15} aria-hidden="true" /> {formatDateTime(report.createdAt)}</strong>
            </div>
            <div>
              <span>Coordenadas</span>
              <strong>{formatCoordinates(report.latitude, report.longitude)}</strong>
            </div>
          </div>

          <section className="occurrence-drawer-progress" aria-labelledby="occurrence-progress-title">
            <p id="occurrence-progress-title" className="eyebrow">Andamento do atendimento</p>
            <StatusTimeline status={report.status} />
          </section>

          {report.status === 'Finalizado' && report.completionPhoto ? (
            <section className="occurrence-drawer-completion" aria-labelledby="occurrence-completion-title">
              <p id="occurrence-completion-title" className="eyebrow">Resultado registrado pela equipe</p>
              <PhotoFrame src={report.completionPhoto} category={report.category} alt={`Fotografia de conclusão da ocorrência ${report.protocol}`} />
            </section>
          ) : null}

          <div className="occurrence-drawer-actions">
            <ConfirmationButton report={report} userId={userId} role={role} onConfirm={onConfirm} />
            <button type="button" className="button-primary occurrence-drawer-details-button" onClick={onViewDetails}>
              Abrir chamado completo <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
