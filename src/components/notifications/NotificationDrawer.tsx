'use client'

import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Info,
  MapPin,
  ShieldAlert,
  Trash2,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '../../navigation'
import { useApp } from '../../context/AppContext'
import type { AppNotification, NotificationType } from '../../types/domain'
import { formatInterventionDateRange } from '../../utils/intervention'


interface NotificationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

function formatRelativeDate(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) return 'Agora mesmo'
    if (diffMinutes < 60) return `Há ${diffMinutes} min`
    if (diffHours < 24) {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `Hoje às ${hours}:${minutes}`
    }
    if (diffDays === 1) {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `Ontem às ${hours}:${minutes}`
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  } catch {
    return 'Recentemente'
  }
}

function getNotificationTypeBadge(type: NotificationType) {
  switch (type) {
    case 'STATUS_UPDATE':
      return {
        label: 'Andamento',
        icon: Wrench,
        className: 'notif-type-status',
      }
    case 'COMMUNITY_SUPPORT':
      return {
        label: 'Apoio popular',
        icon: Users,
        className: 'notif-type-community',
      }
    case 'SERVICE_COMPLETED':
      return {
        label: 'Concluído',
        icon: CheckCircle2,
        className: 'notif-type-completed',
      }
    case 'OFFICIAL_ALERT':
      return {
        label: 'Aviso oficial',
        icon: ShieldAlert,
        className: 'notif-type-alert',
      }
  }
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
  } = useApp()
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'unread') {
      return notifications.filter((item) => !item.read)
    }
    return notifications
  }, [activeFilter, notifications])

  if (!isOpen) return null

  const handleNotificationClick = (item: AppNotification) => {
    markNotificationAsRead(item.id)
    if (item.interventionId) {
      onClose()
      navigate(`/app/mapa?intervencao=${item.interventionId}`)
    } else if (item.reportId) {
      onClose()
      navigate(`/app/chamados/${item.reportId}`)
    }
  }

  return (
    <div
      className="notif-drawer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Central de Notificações"
      onClick={onClose}
    >
      <div
        className="notif-drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="notif-drawer-header">
          <div className="notif-drawer-title-row">
            <div className="notif-drawer-title-group">
              <span className="notif-header-icon" aria-hidden="true">
                <Bell size={20} />
              </span>
              <div>
                <h2>Notificações</h2>
                <span className="notif-subtitle">
                  {unreadNotificationsCount === 0
                    ? 'Tudo atualizado'
                    : `${unreadNotificationsCount} ${unreadNotificationsCount === 1 ? 'não lida' : 'não lidas'}`}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="notif-drawer-close-btn"
              onClick={onClose}
              aria-label="Fechar painel de notificações"
            >
              <X size={20} />
            </button>
          </div>

          <div className="notif-drawer-controls">
            <div className="notif-filter-tabs" role="tablist" aria-label="Filtrar notificações">
              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'all'}
                className={`notif-tab ${activeFilter === 'all' ? 'notif-tab-active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                Todas ({notifications.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'unread'}
                className={`notif-tab ${activeFilter === 'unread' ? 'notif-tab-active' : ''}`}
                onClick={() => setActiveFilter('unread')}
              >
                Não lidas ({unreadNotificationsCount})
              </button>
            </div>

            {unreadNotificationsCount > 0 ? (
              <button
                type="button"
                className="notif-action-btn"
                onClick={markAllNotificationsAsRead}
                aria-label="Marcar todas as notificações como lidas"
              >
                <CheckCheck size={16} />
                <span>Marcar lidas</span>
              </button>
            ) : null}
          </div>
        </header>

        <div className="notif-drawer-body">
          {filteredNotifications.length === 0 ? (
            <div className="notif-empty-state">
              <span className="notif-empty-icon" aria-hidden="true">
                <Info size={32} />
              </span>
              <h3>Nenhuma notificação encontrada</h3>
              <p>
                {activeFilter === 'unread'
                  ? 'Você já leu todas as suas notificações recentes.'
                  : 'Assim que houver novas atualizações nos seus chamados ou avisos da Prefeitura, elas aparecerão aqui.'}
              </p>
            </div>
          ) : (
            <div className="notif-list" role="feed" aria-label="Lista de notificações">
              {filteredNotifications.map((item) => {
                const badge = getNotificationTypeBadge(item.type)
                const BadgeIcon = badge.icon
                return (
                  <article
                    key={item.id}
                    className={`notif-card ${!item.read ? 'notif-card-unread' : ''}`}
                    onClick={() => handleNotificationClick(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleNotificationClick(item)
                      }
                    }}
                    aria-label={`${item.title}, ${badge.label}, ${item.read ? 'lida' : 'não lida'}`}
                  >
                    <div className="notif-card-header">
                      <span className={`notif-type-pill ${badge.className}`}>
                        <BadgeIcon size={13} />
                        <span>{badge.label}</span>
                      </span>
                      <div className="notif-card-meta">
                        <span className="notif-card-time">
                          <Clock size={12} /> {formatRelativeDate(item.createdAt)}
                        </span>
                        {!item.read ? <span className="notif-unread-dot" aria-hidden="true" /> : null}
                      </div>
                    </div>

                    <h4 className="notif-card-title">{item.title}</h4>
                    <p className="notif-card-message">{item.message}</p>

                    {item.interventionId ? (
                      <div className="notif-intervention-preview">
                        {item.affectedLocation ? (
                          <div className="notif-preview-row">
                            <MapPin size={13} aria-hidden="true" />
                            <span><strong>Trecho:</strong> {item.affectedLocation}</span>
                          </div>
                        ) : null}
                        {item.startsAt && item.endsAt ? (
                          <div className="notif-preview-row">
                            <Calendar size={13} aria-hidden="true" />
                            <span><strong>Previsão:</strong> {formatInterventionDateRange(item.startsAt, item.endsAt)}</span>
                          </div>
                        ) : null}
                        {item.impact ? (
                          <div className="notif-preview-row">
                            <AlertTriangle size={13} aria-hidden="true" />
                            <span><strong>Impacto:</strong> {item.impact}</span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="notif-card-footer">
                      {item.protocol ? (
                        <span className="notif-protocol-tag">Protocolo: {item.protocol}</span>
                      ) : <span />}
                      {item.interventionId ? (
                        <span className="notif-card-link notif-card-link-intervention">
                          Ver trecho no mapa <ChevronRight size={14} />
                        </span>
                      ) : item.reportId ? (
                        <span className="notif-card-link">
                          Ver detalhes <ChevronRight size={14} />
                        </span>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        {notifications.length > 0 ? (
          <footer className="notif-drawer-footer">
            <button
              type="button"
              className="notif-clear-btn"
              onClick={clearNotifications}
            >
              <Trash2 size={15} />
              <span>Limpar histórico de notificações</span>
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  )
}
