import { MOCK_REPORTS } from '../data/mockReports'
import type { CreateReportInput, Report, ReportStatus } from '../types/domain'

export const REPORT_STORAGE_KEY = 'cidade-em-ordem:reports:v1'

function cloneReports(reports: Report[]) {
  return reports.map((report) => ({
    ...report,
    citizen: { ...report.citizen },
    confirmations: Array.from(new Set(Array.isArray(report.confirmations) ? report.confirmations : [])),
  }))
}

function readStoredReports(): Report[] | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(REPORT_STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed as Report[]
  } catch {
    return null
  }
}

function saveReports(reports: Report[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reports))
}

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `report-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function nextProtocol(reports: Report[]) {
  const largestNumber = reports.reduce((largest, current) => {
    const match = current.protocol.match(/(\d{4})$/)
    const value = Number(match?.[1] ?? 0)
    return Number.isFinite(value) ? Math.max(largest, value) : largest
  }, 0)
  return `P-${new Date().getFullYear()}-${String(largestNumber + 1).padStart(4, '0')}`
}

function updateReport(id: string, update: (report: Report) => Report) {
  const reports = reportRepository.list()
  const index = reports.findIndex((report) => report.id === id)
  if (index < 0) throw new Error('Ocorrência não encontrada.')
  const updated = update(reports[index])
  reports[index] = updated
  saveReports(reports)
  return updated
}

export const reportRepository = {
  list(): Report[] {
    const stored = readStoredReports()
    if (stored) return cloneReports(stored)
    const seeded = cloneReports(MOCK_REPORTS)
    saveReports(seeded)
    return cloneReports(seeded)
  },

  getById(id: string) {
    return this.list().find((report) => report.id === id)
  },

  remove(id: string) {
    const reports = this.list()
    const index = reports.findIndex((report) => report.id === id)
    if (index < 0) throw new Error('Ocorrência não encontrada.')

    const [removed] = reports.splice(index, 1)
    saveReports(reports)
    return removed
  },

  create(input: CreateReportInput) {
    const reports = this.list()
    const created: Report = {
      id: createId(),
      protocol: nextProtocol(reports),
      category: input.category,
      description: input.description.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      region: input.region,
      address: input.address,
      createdAt: new Date().toISOString(),
      status: 'Aberto',
      citizen: { ...input.citizen },
      confirmations: [],
      photo: input.photo,
    }
    saveReports([created, ...reports])
    return created
  },

  assign(id: string, assignedTo: string) {
    if (!assignedTo) throw new Error('Selecione um responsável.')
    return updateReport(id, (report) => {
      if (report.status !== 'Aberto') {
        throw new Error('A atribuição só pode ser feita em ocorrências abertas.')
      }
      return { ...report, assignedTo }
    })
  },

  start(id: string) {
    return updateReport(id, (report) => {
      if (report.status !== 'Aberto') {
        throw new Error('A ocorrência já iniciou ou encerrou o atendimento.')
      }
      if (!report.assignedTo) {
        throw new Error('Atribua um responsável antes de iniciar o atendimento.')
      }
      return { ...report, status: 'Em atendimento', startedAt: new Date().toISOString() }
    })
  },

  finish(id: string, completionPhoto: string) {
    if (!completionPhoto) throw new Error('A fotografia do resultado é obrigatória.')
    return updateReport(id, (report) => {
      if (report.status !== 'Em atendimento') {
        throw new Error('Somente ocorrências em atendimento podem ser finalizadas.')
      }
      return {
        ...report,
        status: 'Finalizado',
        finishedAt: new Date().toISOString(),
        completionPhoto,
      }
    })
  },

  confirm(id: string, userId: string) {
    if (!userId) throw new Error('Usuário não identificado.')
    return updateReport(id, (report) => {
      if (report.status === 'Finalizado') {
        throw new Error('Ocorrências finalizadas não podem ser confirmadas.')
      }
      if (report.citizen.id === userId) {
        throw new Error('Você não pode confirmar a própria ocorrência.')
      }
      if (report.confirmations.includes(userId)) {
        throw new Error('Você já confirmou esta ocorrência.')
      }
      return { ...report, confirmations: [...report.confirmations, userId] }
    })
  },

  countByStatus(reports: Report[], status: ReportStatus) {
    return reports.filter((report) => report.status === status).length
  },
}

export function averageServiceDuration(reports: Report[]) {
  const finished = reports.filter((report) => report.status === 'Finalizado' && report.finishedAt)
  if (!finished.length) return null
  const total = finished.reduce((sum, report) => {
    return sum + (new Date(report.finishedAt as string).getTime() - new Date(report.createdAt).getTime())
  }, 0)
  return total / finished.length
}
