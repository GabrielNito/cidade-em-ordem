'use client'

import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Cone,
  Info,
  MapPin,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHandle, DrawerTitle } from '../ui/drawer'
import type { ScheduledIntervention, UserRole } from '../../types/domain'
import {
  formatInterventionDateRange,
  formatInterventionDateTime,
  interventionImpactStyles,
  interventionStatusStyles,
  isPendingManagementUpdate,
} from '../../utils/intervention'

interface InterventionDrawerProps {
  intervention: ScheduledIntervention
  role?: UserRole
  onClose: () => void
  onEdit?: (intervention: ScheduledIntervention) => void
}

export function InterventionDrawer({
  intervention,
  role,
  onClose,
  onEdit,
}: InterventionDrawerProps) {
  const [activeSnapPoint, setActiveSnapPoint] = useState<number | string | null>(1)

  useEffect(() => {
    setActiveSnapPoint(1)
  }, [intervention.id])

  const statusStyle = interventionStatusStyles[intervention.status]
  const impactStyle = interventionImpactStyles[intervention.impact]
  const needsUpdate = isPendingManagementUpdate(intervention)
  const isCancelled = intervention.status === 'Cancelada'
  const isFinished = intervention.status === 'Encerrada'

  return (
    <Drawer
      open
      modal
      fixed
      closeThreshold={0.35}
      snapPoints={[0.82]}
      fadeFromIndex={0}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={setActiveSnapPoint}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DrawerContent className="occurrence-drawer-content intervention-drawer-content">
        <DrawerHandle className="occurrence-drawer-handle" />
        <div className="occurrence-drawer-scroll">
          <header className="occurrence-drawer-header">
            <div className="occurrence-drawer-title-row">
              <span className="intervention-drawer-icon" aria-hidden="true">
                <Cone size={22} />
              </span>
              <div>
                <p className="eyebrow">Comunicação Preventiva · Prefeitura de Indaiatuba</p>
                <DrawerTitle id="intervention-drawer-title">{intervention.title}</DrawerTitle>
                <DrawerDescription>
                  {intervention.type} · {intervention.affectedLocation}
                </DrawerDescription>
              </div>
            </div>
            <DrawerClose asChild>
              <button
                type="button"
                className="occurrence-drawer-close"
                onClick={onClose}
                aria-label="Fechar detalhes da intervenção"
              >
                <X size={19} />
              </button>
            </DrawerClose>
          </header>

          {/* Banner de status crítico */}
          {isCancelled ? (
            <div className="intervention-banner intervention-banner-cancelled" role="alert">
              <XCircle size={18} className="shrink-0" aria-hidden="true" />
              <div>
                <strong>Intervenção cancelada</strong>
                <p>O serviço programado foi cancelado pela administração municipal. Observe a sinalização local para condições de tráfego.</p>
              </div>
            </div>
          ) : isFinished ? (
            <div className="intervention-banner intervention-banner-finished" role="status">
              <CheckCircle2 size={18} className="shrink-0" aria-hidden="true" />
              <div>
                <strong>Intervenção encerrada</strong>
                <p>O serviço no trecho foi concluído com sucesso e a via está liberada para o tráfego normal.</p>
              </div>
            </div>
          ) : needsUpdate ? (
            <div className="intervention-banner intervention-banner-warning" role="alert">
              <AlertTriangle size={18} className="shrink-0" aria-hidden="true" />
              <div>
                <strong>Previsão de término encerrada · Aguardando atualização municipal</strong>
                <p>
                  O horário previsto ultrapassou o estimado. A gestão municipal ainda não confirmou o término
                  oficial da obra — a via não é considerada liberada automaticamente.
                </p>
              </div>
            </div>
          ) : null}

          {/* Badges de Situação e Impacto */}
          <div className="intervention-badges-row">
            <span
              className="intervention-status-pill"
              style={{
                backgroundColor: statusStyle.bg,
                color: statusStyle.color,
                borderColor: statusStyle.border,
              }}
            >
              <span className="intervention-status-dot" style={{ backgroundColor: statusStyle.color }} />
              {statusStyle.label}
            </span>

            <span
              className="intervention-impact-pill"
              style={{
                backgroundColor: impactStyle.bg,
                color: impactStyle.color,
                borderColor: impactStyle.border,
              }}
            >
              <AlertCircle size={13} aria-hidden="true" />
              {impactStyle.label}
            </span>
          </div>

          {/* Trecho afetado */}
          <div className="intervention-card-section">
            <span className="intervention-section-label">
              <MapPin size={15} aria-hidden="true" /> Trecho afetado
            </span>
            <p className="intervention-location-text">{intervention.affectedLocation}</p>
            <span className="intervention-geo-hint">
              {intervention.geometry.length} pontos mapeados no traçado indicativo aproximado
            </span>
          </div>

          {/* Período previsto */}
          <div className="intervention-card-section">
            <span className="intervention-section-label">
              <Calendar size={15} aria-hidden="true" /> Período previsto de execução
            </span>
            <p className="intervention-date-range">
              {formatInterventionDateRange(intervention.startsAt, intervention.endsAt)}
            </p>
            <div className="intervention-subdates">
              <span>
                <Clock size={12} /> Início: {formatInterventionDateTime(intervention.startsAt)}
              </span>
              <span>
                <Clock size={12} /> Término previsto: {formatInterventionDateTime(intervention.endsAt)}
              </span>
            </div>
            <p className="intervention-disclaimer">
              * Horários e datas informados são previsões operacionais de engenharia de tráfego sujeitas a
              alterações meteorológicas ou de campo.
            </p>
          </div>

          {/* Descrição */}
          <section className="intervention-card-section" aria-labelledby="interv-desc-heading">
            <span id="interv-desc-heading" className="intervention-section-label">
              <Info size={15} aria-hidden="true" /> Detalhes da obra / serviço
            </span>
            <p className="intervention-description-text">{intervention.description}</p>
          </section>

          {/* Orientações aos munícipes */}
          {intervention.guidance ? (
            <section className="intervention-guidance-box" aria-labelledby="interv-guidance-heading">
              <span id="interv-guidance-heading" className="intervention-guidance-title">
                <ShieldAlert size={16} aria-hidden="true" /> Orientações para os cidadãos
              </span>
              <p className="intervention-guidance-text">{intervention.guidance}</p>
            </section>
          ) : null}

          {/* Ações para gestão */}
          {role === 'MANAGER' && onEdit ? (
            <div className="intervention-drawer-actions">
              <button
                type="button"
                className="button-primary w-full"
                onClick={() => {
                  onClose()
                  onEdit(intervention)
                }}
              >
                Editar ou alterar situação desta intervenção
              </button>
            </div>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
