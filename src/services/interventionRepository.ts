import { MOCK_INTERVENTIONS } from '../data/mockInterventions'
import type {
  CreateInterventionInput,
  InterventionStatus,
  ScheduledIntervention,
  UpdateInterventionInput,
} from '../types/domain'
import { validateInterventionDates, validateInterventionGeometry } from '../utils/intervention'

export const INTERVENTION_STORAGE_KEY = 'cidade-em-ordem:interventions:v1'

function cloneInterventions(list: ScheduledIntervention[]): ScheduledIntervention[] {
  return list.map((item) => ({
    ...item,
    geometry: item.geometry.map((pt) => ({ ...pt })),
  }))
}

function readStoredInterventions(): ScheduledIntervention[] | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(INTERVENTION_STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed as ScheduledIntervention[]
  } catch {
    return null
  }
}

function saveInterventions(list: ScheduledIntervention[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(INTERVENTION_STORAGE_KEY, JSON.stringify(list))
}

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `intervention-${crypto.randomUUID()}`
    : `intervention-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const interventionRepository = {
  list(): ScheduledIntervention[] {
    const stored = readStoredInterventions()
    if (stored) return cloneInterventions(stored)
    const seeded = cloneInterventions(MOCK_INTERVENTIONS)
    saveInterventions(seeded)
    return cloneInterventions(seeded)
  },

  getById(id: string): ScheduledIntervention | undefined {
    return this.list().find((item) => item.id === id)
  },

  create(input: CreateInterventionInput, createdBy = 'Gestão Municipal'): ScheduledIntervention {
    if (!input.title?.trim()) {
      throw new Error('O título da intervenção é obrigatório.')
    }
    if (!input.type) {
      throw new Error('O tipo de intervenção é obrigatório.')
    }
    if (!input.description?.trim()) {
      throw new Error('A descrição da intervenção é obrigatória.')
    }
    if (!input.affectedLocation?.trim()) {
      throw new Error('O trecho afetado é obrigatório.')
    }
    if (!input.impact) {
      throw new Error('O nível de impacto é obrigatório.')
    }

    const dateCheck = validateInterventionDates(input.startsAt, input.endsAt)
    if (!dateCheck.valid) {
      throw new Error(dateCheck.error)
    }

    const geomCheck = validateInterventionGeometry(input.geometry)
    if (!geomCheck.valid) {
      throw new Error(geomCheck.error)
    }

    const currentList = this.list()
    const nowIso = new Date().toISOString()

    const created: ScheduledIntervention = {
      id: createId(),
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      affectedLocation: input.affectedLocation.trim(),
      geometry: input.geometry.map((pt) => ({ ...pt })),
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      impact: input.impact,
      guidance: input.guidance?.trim() || undefined,
      status: 'Programada',
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy,
    }

    saveInterventions([created, ...currentList])
    return created
  },

  update(id: string, input: UpdateInterventionInput): ScheduledIntervention {
    const list = this.list()
    const index = list.findIndex((item) => item.id === id)
    if (index < 0) {
      throw new Error('Intervenção não encontrada.')
    }

    const existing = list[index]
    const nextStartsAt = input.startsAt ?? existing.startsAt
    const nextEndsAt = input.endsAt ?? existing.endsAt

    if (input.startsAt !== undefined || input.endsAt !== undefined) {
      const dateCheck = validateInterventionDates(nextStartsAt, nextEndsAt)
      if (!dateCheck.valid) {
        throw new Error(dateCheck.error)
      }
    }

    if (input.geometry !== undefined) {
      const geomCheck = validateInterventionGeometry(input.geometry)
      if (!geomCheck.valid) {
        throw new Error(geomCheck.error)
      }
    }

    const updated: ScheduledIntervention = {
      ...existing,
      title: input.title !== undefined ? input.title.trim() : existing.title,
      description: input.description !== undefined ? input.description.trim() : existing.description,
      type: input.type ?? existing.type,
      affectedLocation:
        input.affectedLocation !== undefined ? input.affectedLocation.trim() : existing.affectedLocation,
      geometry: input.geometry ? input.geometry.map((pt) => ({ ...pt })) : existing.geometry,
      startsAt: nextStartsAt,
      endsAt: nextEndsAt,
      impact: input.impact ?? existing.impact,
      guidance: input.guidance !== undefined ? input.guidance.trim() : existing.guidance,
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    }

    list[index] = updated
    saveInterventions(list)
    return updated
  },

  changeStatus(id: string, status: InterventionStatus): ScheduledIntervention {
    return this.update(id, { status })
  },

  cancel(id: string, guidanceUpdate?: string): ScheduledIntervention {
    const list = this.list()
    const target = list.find((item) => item.id === id)
    if (!target) throw new Error('Intervenção não encontrada.')

    const guidance = guidanceUpdate?.trim()
      ? `${target.guidance ? `${target.guidance}\n\n` : ''}Cancelamento: ${guidanceUpdate.trim()}`
      : target.guidance

    return this.update(id, {
      status: 'Cancelada',
      guidance,
    })
  },

  countByStatus(status: InterventionStatus): number {
    return this.list().filter((item) => item.status === status).length
  },

  resetToMock(): ScheduledIntervention[] {
    const seeded = cloneInterventions(MOCK_INTERVENTIONS)
    saveInterventions(seeded)
    return seeded
  },
}
