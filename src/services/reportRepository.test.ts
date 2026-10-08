import { beforeEach, describe, expect, it } from 'vitest'
import { DEMO_CITIZEN } from '../data/mockReports'
import { reportRepository, averageServiceDuration, REPORT_STORAGE_KEY } from './reportRepository'

const baseInput = {
  category: 'Buraco na via' as const,
  description: 'Buraco identificado na faixa direita da avenida.',
  latitude: -23.09,
  longitude: -47.21,
  region: 'Centro',
  address: 'Coordenadas do dispositivo',
  citizen: DEMO_CITIZEN,
  photo: 'data:image/png;base64,photo',
}

describe('reportRepository', () => {
  beforeEach(() => {
    localStorage.removeItem(REPORT_STORAGE_KEY)
  })

  it('cria uma ocorrência persistida com status Aberto', () => {
    const created = reportRepository.create(baseInput)
    expect(created.status).toBe('Aberto')
    expect(reportRepository.getById(created.id)?.protocol).toBe(created.protocol)
    expect(reportRepository.list()).toHaveLength(17)
  })

  it('exige responsável para iniciar e permite a transição correta', () => {
    const created = reportRepository.create(baseInput)
    expect(() => reportRepository.start(created.id)).toThrow('Atribua um responsável')
    reportRepository.assign(created.id, 'crew-ana')
    const started = reportRepository.start(created.id)
    expect(started.status).toBe('Em atendimento')
    expect(started.startedAt).toBeDefined()
  })

  it('exige fotografia para finalizar e impede finalizar diretamente uma ocorrência aberta', () => {
    const created = reportRepository.create(baseInput)
    expect(() => reportRepository.finish(created.id, 'photo')).toThrow('Somente ocorrências em atendimento')
    reportRepository.assign(created.id, 'crew-ana')
    reportRepository.start(created.id)
    expect(() => reportRepository.finish(created.id, '')).toThrow('fotografia do resultado')
    const finished = reportRepository.finish(created.id, 'data:image/png;base64,completion')
    expect(finished.status).toBe('Finalizado')
    expect(finished.finishedAt).toBeDefined()
  })

  it('calcula o tempo médio apenas entre chamados finalizados', () => {
    const reports = reportRepository.list()
    const average = averageServiceDuration(reports)
    expect(average).toBeGreaterThan(0)
    expect(reports.filter((report) => report.status === 'Finalizado').every((report) => report.finishedAt)).toBe(true)
  })

  it('persiste confirmações, impede duplicidade e respeita autoria e status', () => {
    const confirmed = reportRepository.confirm('report-013', DEMO_CITIZEN.id)
    expect(confirmed.confirmations).toContain(DEMO_CITIZEN.id)
    expect(reportRepository.getById('report-013')?.confirmations).toContain(DEMO_CITIZEN.id)
    expect(() => reportRepository.confirm('report-013', DEMO_CITIZEN.id)).toThrow('já confirmou')
    expect(() => reportRepository.confirm('report-001', DEMO_CITIZEN.id)).toThrow('própria ocorrência')
    expect(() => reportRepository.confirm('report-003', DEMO_CITIZEN.id)).toThrow('finalizadas')
  })

  it('remove uma ocorrência persistida e rejeita um identificador desconhecido', () => {
    const removed = reportRepository.remove('report-013')

    expect(removed.id).toBe('report-013')
    expect(reportRepository.getById('report-013')).toBeUndefined()
    expect(reportRepository.list()).toHaveLength(15)
    expect(JSON.parse(localStorage.getItem(REPORT_STORAGE_KEY) ?? '[]')).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'report-013' })]),
    )
    expect(() => reportRepository.remove('report-does-not-exist')).toThrow('Ocorrência não encontrada')
  })
})
