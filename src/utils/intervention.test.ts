import { describe, expect, it } from 'vitest'
import {
  formatInterventionDateRange,
  formatInterventionDateTime,
  isInterventionPastEstimatedEnd,
  isPendingManagementUpdate,
  validateInterventionDates,
  validateInterventionGeometry,
} from './intervention'
import type { ScheduledIntervention } from '../types/domain'

describe('intervention utilities', () => {
  it('formata datas e horários no padrão pt-BR', () => {
    const formatted = formatInterventionDateTime('2026-10-08T08:30:00-03:00')
    expect(formatted).toContain('08/10/2026')
    expect(formatted).toContain('08:30')
  })

  it('formata intervalo do mesmo dia com horário inicial e final', () => {
    const range = formatInterventionDateRange(
      '2026-10-08T08:00:00-03:00',
      '2026-10-08T12:00:00-03:00',
    )
    expect(range).toContain('8 de outubro')
    expect(range).toContain('Das 08:00 às 12:00')
  })

  it('formata intervalo entre dias distintos', () => {
    const range = formatInterventionDateRange(
      '2026-10-08T08:00:00-03:00',
      '2026-10-09T18:00:00-03:00',
    )
    expect(range).toContain('De 08/10 às 08:00 até 09/10 às 18:00')
  })

  it('detecta intervenção cujo horário previsto de término já passou', () => {
    const pastIntervention: ScheduledIntervention = {
      id: 'inv-1',
      title: 'Intervenção passada',
      description: 'Desc',
      type: 'Interdição',
      affectedLocation: 'Av. Conceição',
      geometry: [
        { latitude: -23.08, longitude: -47.2 },
        { latitude: -23.09, longitude: -47.21 },
      ],
      startsAt: '2026-10-01T08:00:00-03:00',
      endsAt: '2026-10-01T12:00:00-03:00',
      impact: 'Interdição total',
      status: 'Em andamento',
      createdAt: '2026-10-01T07:00:00-03:00',
      updatedAt: '2026-10-01T07:00:00-03:00',
    }

    expect(isInterventionPastEstimatedEnd(pastIntervention)).toBe(true)
    expect(isPendingManagementUpdate(pastIntervention)).toBe(true)

    // Se já estiver encerrada ou cancelada, não acusa pendência de atualização
    expect(isPendingManagementUpdate({ ...pastIntervention, status: 'Encerrada' })).toBe(false)
    expect(isPendingManagementUpdate({ ...pastIntervention, status: 'Cancelada' })).toBe(false)
  })

  it('valida datas garantindo preenchimento e ordem cronológica', () => {
    expect(validateInterventionDates('', '').valid).toBe(false)
    expect(validateInterventionDates('invalida', '2026-10-08T10:00').valid).toBe(false)
    expect(validateInterventionDates('2026-10-08T12:00', '2026-10-08T10:00').valid).toBe(false)
    expect(validateInterventionDates('2026-10-08T08:00', '2026-10-08T12:00').valid).toBe(true)
  })

  it('valida coordenadas e número mínimo de pontos na geometria', () => {
    expect(validateInterventionGeometry([]).valid).toBe(false)
    expect(validateInterventionGeometry([{ latitude: -23.08, longitude: -47.2 }]).valid).toBe(false)
    expect(
      validateInterventionGeometry([
        { latitude: -23.08, longitude: -47.2 },
        { latitude: -23.09, longitude: -47.21 },
      ]).valid,
    ).toBe(true)
  })
})
