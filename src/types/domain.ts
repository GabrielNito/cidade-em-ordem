export const REPORT_STATUSES = ['Aberto', 'Em atendimento', 'Finalizado'] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]

export const REPORT_CATEGORIES = [
  'Buraco na via',
  'Iluminação',
  'Limpeza',
  'Sinalização',
  'Poda',
] as const
export type ReportCategory = (typeof REPORT_CATEGORIES)[number]

export const USER_ROLES = ['CITIZEN', 'FIELD_AGENT', 'MANAGER'] as const
export type UserRole = (typeof USER_ROLES)[number]

export interface DemoUser {
  id: string
  name: string
  email: string
}

export interface Report {
  id: string
  protocol: string
  category: ReportCategory
  description: string
  latitude: number
  longitude: number
  region: string
  address?: string
  createdAt: string
  status: ReportStatus
  citizen: DemoUser
  confirmations: string[]
  photo?: string
  assignedTo?: string
  startedAt?: string
  finishedAt?: string
  completionPhoto?: string
}

export interface CreateReportInput {
  category: ReportCategory
  description: string
  latitude: number
  longitude: number
  region: string
  address?: string
  citizen: DemoUser
  photo: string
}

export interface CrewMember {
  id: string
  name: string
  specialty: string
  initials: string
}

export interface GeoPoint {
  latitude: number
  longitude: number
}
