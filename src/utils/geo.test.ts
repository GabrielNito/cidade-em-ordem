import { describe, expect, it } from 'vitest'
import type { Report } from '../types/domain'
import {
  calculateRouteDistanceKm,
  distanceInMeters,
  fetchStreetRoute,
  findNearbyReports,
  getRenderableRouteCoordinates,
  optimizeRouteOrder,
} from './geo'

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

  it('calcula a distância acumulada de uma rota em km', () => {
    const points = [
      { latitude: -23.0888, longitude: -47.2185 },
      { latitude: -23.0955, longitude: -47.214 },
      { latitude: -23.112, longitude: -47.234 },
    ]
    const km = calculateRouteDistanceKm(points)
    expect(km).toBeGreaterThan(2.5)
    expect(km).toBeLessThan(4.5)
  })

  it('otimiza a ordem de paradas usando vizinho mais próximo', () => {
    const p1 = { id: '1', latitude: -23.08, longitude: -47.2 }
    const p2 = { id: '2', latitude: -23.12, longitude: -47.24 } // Far
    const p3 = { id: '3', latitude: -23.081, longitude: -47.201 } // Close to p1
    const optimized = optimizeRouteOrder([p1, p2, p3])
    expect(optimized.map((p) => p.id)).toEqual(['1', '3', '2'])
  })

  it('retorna traçado e dados de rota para pontos fornecidos', async () => {
    const single = await fetchStreetRoute([{ latitude: -23.08, longitude: -47.2 }])
    expect(single?.coordinates.length).toBe(1)

    const points = [
      { latitude: -23.0888, longitude: -47.2185 },
      { latitude: -23.0955, longitude: -47.214 },
    ]
    const result = await fetchStreetRoute(points)
    expect(result).not.toBeNull()
    expect(result?.coordinates.length).toBeGreaterThanOrEqual(2)
    expect(typeof result?.isFallback).toBe('boolean')
  })

  it('prefere a geometria calculada pelas vias ao desenhar um trecho', () => {
    const anchors = [
      { latitude: -23.08, longitude: -47.2 },
      { latitude: -23.082, longitude: -47.204 },
    ]
    const routedCoordinates: [number, number][] = [
      [-23.08, -47.2],
      [-23.0811, -47.2014],
      [-23.0804, -47.2032],
      [-23.082, -47.204],
    ]

    expect(
      getRenderableRouteCoordinates(anchors, {
        coordinates: routedCoordinates,
        distanceKm: 0.6,
        durationMinutes: 2,
      }),
    ).toEqual(routedCoordinates)
    expect(getRenderableRouteCoordinates(anchors, null)).toEqual(
      anchors.map((point) => [point.latitude, point.longitude]),
    )
  })
})
