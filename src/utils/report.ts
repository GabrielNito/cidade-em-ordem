import type { LucideIcon } from 'lucide-react'
import { CircleAlert, Lightbulb, Recycle, Signpost, TreePine } from 'lucide-react'
import type { ReportCategory, ReportStatus, UserRole } from '../types/domain'

export const STATUS_ORDER: ReportStatus[] = ['Aberto', 'Em atendimento', 'Finalizado']

export const statusStyles: Record<ReportStatus, { label: string; className: string; dot: string }> = {
  Aberto: { label: 'Aberto', className: 'status-open', dot: '#c98228' },
  'Em atendimento': { label: 'Em atendimento', className: 'status-progress', dot: '#347a8b' },
  Finalizado: { label: 'Finalizado', className: 'status-done', dot: '#34805e' },
}

export const categoryStyles: Record<ReportCategory, { icon: LucideIcon; className: string; accent: string }> = {
  'Buraco na via': { icon: CircleAlert, className: 'category-road', accent: '#c98228' },
  Iluminação: { icon: Lightbulb, className: 'category-light', accent: '#8d6815' },
  Limpeza: { icon: Recycle, className: 'category-clean', accent: '#297968' },
  Sinalização: { icon: Signpost, className: 'category-sign', accent: '#356ea0' },
  Poda: { icon: TreePine, className: 'category-tree', accent: '#53804d' },
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(value))
    .replace('.', '')
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value)).replace('.', '')
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatCoordinates(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
}

export function formatDuration(milliseconds: number | null) {
  if (milliseconds === null) return 'Sem dados'
  const totalMinutes = Math.max(0, Math.round(milliseconds / 60000))
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}min`
  return `${minutes}min`
}

export function formatCount(count: number) {
  return new Intl.NumberFormat('pt-BR').format(count)
}

export function pathForRole(role: UserRole) {
  if (role === 'FIELD_AGENT') return '/campo/ordens'
  if (role === 'MANAGER') return '/gestao/dashboard'
  return '/app/mapa'
}

export function isReportStatus(value: string): value is ReportStatus {
  return STATUS_ORDER.includes(value as ReportStatus)
}
