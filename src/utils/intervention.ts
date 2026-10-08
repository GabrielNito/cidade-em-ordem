import type { InterventionImpact, InterventionStatus, ScheduledIntervention, GeoPoint } from '../types/domain'

export const interventionStatusStyles: Record<
  InterventionStatus,
  { label: string; bg: string; color: string; border: string; polylineColor: string }
> = {
  Programada: {
    label: 'Programada',
    bg: '#eff6ff',
    color: '#1d4ed8',
    border: '#bfdbfe',
    polylineColor: '#2563eb',
  },
  'Em andamento': {
    label: 'Em andamento',
    bg: '#fff7ed',
    color: '#c2410c',
    border: '#fed7aa',
    polylineColor: '#ea580c',
  },
  Encerrada: {
    label: 'Encerrada',
    bg: '#f0fdf4',
    color: '#15803d',
    border: '#bbf7d0',
    polylineColor: '#16a34a',
  },
  Cancelada: {
    label: 'Cancelada',
    bg: '#fef2f2',
    color: '#b91c1c',
    border: '#fecaca',
    polylineColor: '#94a3b8',
  },
}

export const interventionImpactStyles: Record<
  InterventionImpact,
  { label: string; bg: string; color: string; border: string }
> = {
  'Interdição total': {
    label: 'Interdição total',
    bg: '#fef2f2',
    color: '#991b1b',
    border: '#f87171',
  },
  'Interdição parcial': {
    label: 'Interdição parcial',
    bg: '#fff7ed',
    color: '#9a3412',
    border: '#fb923c',
  },
  'Restrição de acesso': {
    label: 'Restrição de acesso',
    bg: '#fefce8',
    color: '#854d0e',
    border: '#facc15',
  },
  'Possível lentidão': {
    label: 'Possível lentidão',
    bg: '#f8fafc',
    color: '#475569',
    border: '#cbd5e1',
  },
}

export function formatInterventionDateTime(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    if (isNaN(d.getTime())) return isoDate
    return d.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoDate
  }
}

export function formatInterventionDateRange(startsAt: string, endsAt: string): string {
  try {
    const start = new Date(startsAt)
    const end = new Date(endsAt)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return `${startsAt} até ${endsAt}`
    }

    const sameDay =
      start.getDate() === end.getDate() &&
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()

    const startTime = start.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    })
    const endTime = end.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    })

    if (sameDay) {
      const weekday = start.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        weekday: 'long',
      })
      const dayMonth = start.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: 'numeric',
        month: 'long',
      })
      const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
      return `${capitalizedWeekday}, ${dayMonth} · Das ${startTime} às ${endTime}`
    }

    const startFull = start.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
    })
    const endFull = end.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
    })

    return `De ${startFull} às ${startTime} até ${endFull} às ${endTime}`
  } catch {
    return `${startsAt} até ${endsAt}`
  }
}

export function isInterventionPastEstimatedEnd(intervention: ScheduledIntervention): boolean {
  try {
    const end = new Date(intervention.endsAt)
    return !isNaN(end.getTime()) && Date.now() > end.getTime()
  } catch {
    return false
  }
}

export function isPendingManagementUpdate(intervention: ScheduledIntervention): boolean {
  return (
    isInterventionPastEstimatedEnd(intervention) &&
    intervention.status !== 'Encerrada' &&
    intervention.status !== 'Cancelada'
  )
}

export function validateInterventionDates(
  startsAt: string,
  endsAt: string,
): { valid: boolean; error?: string } {
  if (!startsAt || !endsAt) {
    return { valid: false, error: 'As datas de início e término são obrigatórias.' }
  }
  const startDate = new Date(startsAt)
  const endDate = new Date(endsAt)
  if (isNaN(startDate.getTime())) {
    return { valid: false, error: 'Data de início inválida.' }
  }
  if (isNaN(endDate.getTime())) {
    return { valid: false, error: 'Data de término inválida.' }
  }
  if (endDate.getTime() <= startDate.getTime()) {
    return { valid: false, error: 'O término previsto deve ser posterior ao início previsto.' }
  }
  return { valid: true }
}

export function validateInterventionGeometry(
  geometry: GeoPoint[],
): { valid: boolean; error?: string } {
  if (!Array.isArray(geometry) || geometry.length < 2) {
    return { valid: false, error: 'O trecho afetado deve conter no mínimo dois pontos no mapa.' }
  }
  for (const p of geometry) {
    if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number' || isNaN(p.latitude) || isNaN(p.longitude)) {
      return { valid: false, error: 'Coordenadas geográficas inválidas encontradas no trecho.' }
    }
  }
  return { valid: true }
}
