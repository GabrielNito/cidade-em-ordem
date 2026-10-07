import { describe, expect, it } from 'vitest'
import type { Report } from '../types/domain'
import { distanceInMeters, findNearbyReports } from './geo'

const baseReport: Report = {
  id: 'nearby-report',
  protocol: 'P-2026-0099',
  category: 'Buraco na via',
  description: 'Problema no pavimento próximo ao meio-fio.',
  latitude: -23.09,
  longitude: -47.21,
  region: 'Centro',
  createdAt: '2026-10-07T10:00:00-03:00',
  status: 'Aberto',
  citizen: { id: 'citizen-other', name: 'Outra pessoa', email: 'outra@local' },
  confirmations: [],
}

describe('geo helpers', () => {
  it('calcula distância geográfica em metros', () => {
    const distance = distanceInMeters(
      { latitude: -23.09, longitude: -47.21 },
      { latitude: -23.09, longitude: -47.2099 },
    )
    expect(distance).toBeGreaterThan(9)
    expect(distance).toBeLessThan(12)
  })

  it('encontra ocorrências não finalizadas no raio e prioriza a categoria', () => {
    const sameCategory = { ...baseReport, id: 'same-category', longitude: -47.2097 }
    const otherCategory = { ...baseReport, id: 'other-category', category: 'Poda' as const, longitude: -47.20995 }
    const finalized = { ...baseReport, id: 'finalized', status: 'Finalizado' as const, longitude: -47.20995 }
    const result = findNearbyReports(
      [otherCategory, finalized, sameCategory],
      { latitude: -23.09, longitude: -47.21 },
      'Buraco na via',
      50,
    )

    expect(result.map(({ report }) => report.id)).toEqual(['same-category', 'other-category'])
    expect(result.every(({ report }) => report.status !== 'Finalizado')).toBe(true)
  })
})
