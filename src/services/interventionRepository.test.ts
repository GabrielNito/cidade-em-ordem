import { beforeEach, describe, expect, it } from 'vitest'
import {
  INTERVENTION_STORAGE_KEY,
  interventionRepository,
} from './interventionRepository'
import { REPORT_STORAGE_KEY, averageServiceDuration, reportRepository } from './reportRepository'
import type { CreateInterventionInput, ScheduledIntervention } from '../types/domain'
import {
  isInterventionPastEstimatedEnd,
  isPendingManagementUpdate,
  validateInterventionDates,
  validateInterventionGeometry,
} from '../utils/intervention'

const baseInterventionInput: CreateInterventionInput = {
  title: 'Manutenção de pavimento na Av. Conceição',
  type: 'Manutenção viária',
  description: 'Reparo profundo de base asfáltica e fresagem.',
  affectedLocation: 'Av. Conceição, altura do nº 1200',
  startsAt: '2026-10-08T08:00:00-03:00',
  endsAt: '2026-10-08T12:00:00-03:00',
  impact: 'Interdição parcial',
  guidance: 'Trânsito em meia pista. Reduza a velocidade.',
  geometry: [
    { latitude: -23.0815, longitude: -47.205 },
    { latitude: -23.0832, longitude: -47.2085 },
  ],
}

describe('interventionRepository', () => {
  beforeEach(() => {
    localStorage.removeItem(INTERVENTION_STORAGE_KEY)
    localStorage.removeItem(REPORT_STORAGE_KEY)
  })

  it('cria uma intervenção persistida com status Programada e autoria', () => {
    const created = interventionRepository.create(baseInterventionInput, 'Carlos Gestor')
    expect(created.status).toBe('Programada')
    expect(created.createdBy).toBe('Carlos Gestor')
    expect(created.id).toContain('intervention-')

    const persisted = interventionRepository.getById(created.id)
    expect(persisted).toBeDefined()
    expect(persisted?.title).toBe(baseInterventionInput.title)
    expect(persisted?.geometry).toHaveLength(2)
  })

  it('valida e exige que o término seja posterior ao início', () => {
    expect(() =>
      interventionRepository.create({
        ...baseInterventionInput,
        startsAt: '2026-10-08T14:00:00-03:00',
        endsAt: '2026-10-08T10:00:00-03:00',
      }),
    ).toThrow('término previsto deve ser posterior ao início')

    expect(() =>
      interventionRepository.create({
        ...baseInterventionInput,
        startsAt: '2026-10-08T10:00:00-03:00',
        endsAt: '2026-10-08T10:00:00-03:00',
      }),
    ).toThrow('término previsto deve ser posterior ao início')

    const dateValidation = validateInterventionDates('2026-10-08T12:00', '2026-10-08T08:00')
    expect(dateValidation.valid).toBe(false)
  })

  it('valida que a geometria possui no mínimo dois pontos no mapa', () => {
    expect(() =>
      interventionRepository.create({
        ...baseInterventionInput,
        geometry: [{ latitude: -23.08, longitude: -47.2 }],
      }),
    ).toThrow('no mínimo dois pontos')

    expect(() =>
      interventionRepository.create({
        ...baseInterventionInput,
        geometry: [],
      }),
    ).toThrow('no mínimo dois pontos')

    const geomValidation = validateInterventionGeometry([])
    expect(geomValidation.valid).toBe(false)
  })

  it('permite edição mantendo integridade e atualizando updatedAt', () => {
    const created = interventionRepository.create(baseInterventionInput)
    const updated = interventionRepository.update(created.id, {
      title: 'Interdição ampliada na Av. Conceição',
      impact: 'Interdição total',
      affectedLocation: 'Av. Conceição, trecho completo',
    })

    expect(updated.title).toBe('Interdição ampliada na Av. Conceição')
    expect(updated.impact).toBe('Interdição total')
    expect(updated.affectedLocation).toBe('Av. Conceição, trecho completo')
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.createdAt).getTime(),
    )
  })

  it('permite transição de situação e cancelamento com registro de motivo', () => {
    const created = interventionRepository.create(baseInterventionInput)

    const inProgress = interventionRepository.changeStatus(created.id, 'Em andamento')
    expect(inProgress.status).toBe('Em andamento')

    const cancelled = interventionRepository.cancel(
      created.id,
      'Chuvas intensas impediram a fresagem.',
    )
    expect(cancelled.status).toBe('Cancelada')
    expect(cancelled.guidance).toContain('Cancelamento: Chuvas intensas')

    const finalQuery = interventionRepository.getById(created.id)
    expect(finalQuery?.status).toBe('Cancelada')
  })

  it('mantém separação estrita entre ocorrências de zeladoria e intervenções programadas', () => {
    const reportCountBefore = reportRepository.list().length
    const createdIntervention = interventionRepository.create(baseInterventionInput)

    // Ocorrências não foram alteradas
    const reportCountAfter = reportRepository.list().length
    expect(reportCountAfter).toBe(reportCountBefore)

    // Chaves de armazenamento distintas
    const storedReports = localStorage.getItem(REPORT_STORAGE_KEY)
    const storedInterventions = localStorage.getItem(INTERVENTION_STORAGE_KEY)
    expect(storedReports).not.toContain(createdIntervention.id)
    expect(storedInterventions).toContain(createdIntervention.id)
  })

  it('intervenção encerrada não afeta as métricas de tempo de resolução de chamados', () => {
    const reports = reportRepository.list()
    const originalAverage = averageServiceDuration(reports)

    // Cria e encerra uma intervenção
    const intervention = interventionRepository.create({
      ...baseInterventionInput,
      startsAt: '2026-10-01T08:00:00-03:00',
      endsAt: '2026-10-01T18:00:00-03:00',
    })
    interventionRepository.changeStatus(intervention.id, 'Encerrada')

    // Métrica de chamados de zeladoria continua idêntica
    const averageAfter = averageServiceDuration(reports)
    expect(averageAfter).toBe(originalAverage)
  })

  it('horário previsto vencido não marca conclusão automática da intervenção', () => {
    const pastIntervention: ScheduledIntervention = {
      id: 'interv-past',
      title: 'Obra com horário ultrapassado',
      description: 'Drenagem profunda',
      type: 'Infraestrutura',
      affectedLocation: 'Rua Candelária',
      geometry: [
        { latitude: -23.08, longitude: -47.2 },
        { latitude: -23.082, longitude: -47.202 },
      ],
      startsAt: '2026-10-01T08:00:00-03:00',
      endsAt: '2026-10-01T12:00:00-03:00',
      impact: 'Interdição parcial',
      status: 'Programada', // Permanece como informada pela gestão
      createdAt: '2026-10-01T07:00:00-03:00',
      updatedAt: '2026-10-01T07:00:00-03:00',
    }

    expect(isInterventionPastEstimatedEnd(pastIntervention)).toBe(true)
    // Indica que necessita de atualização da gestão e NÃO presume liberação ou encerramento
    expect(isPendingManagementUpdate(pastIntervention)).toBe(true)
    expect(pastIntervention.status).toBe('Programada')
  })
})
