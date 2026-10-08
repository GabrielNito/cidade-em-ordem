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

export type NotificationType =
  | 'STATUS_UPDATE'
  | 'COMMUNITY_SUPPORT'
  | 'SERVICE_COMPLETED'
  | 'OFFICIAL_ALERT'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  protocol?: string
  reportId?: string
  interventionId?: string
  affectedLocation?: string
  startsAt?: string
  endsAt?: string
  impact?: InterventionImpact
  read: boolean
  createdAt: string
}

export const INTERVENTION_STATUSES = [
  'Programada',
  'Em andamento',
  'Encerrada',
  'Cancelada',
] as const
export type InterventionStatus = (typeof INTERVENTION_STATUSES)[number]

export const INTERVENTION_TYPES = [
  'Manutenção viária',
  'Interdição',
  'Sinalização',
  'Infraestrutura',
  'Outros',
] as const
export type InterventionType = (typeof INTERVENTION_TYPES)[number]

export const INTERVENTION_IMPACTS = [
  'Interdição total',
  'Interdição parcial',
  'Restrição de acesso',
  'Possível lentidão',
] as const
export type InterventionImpact = (typeof INTERVENTION_IMPACTS)[number]

export interface ScheduledIntervention {
  id: string
  title: string
  description: string
  type: InterventionType
  affectedLocation: string
  geometry: GeoPoint[]
  startsAt: string
  endsAt: string
  impact: InterventionImpact
  guidance?: string
  status: InterventionStatus
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface CreateInterventionInput {
  title: string
  description: string
  type: InterventionType
  affectedLocation: string
  geometry: GeoPoint[]
  startsAt: string
  endsAt: string
  impact: InterventionImpact
  guidance?: string
}

export type UpdateInterventionInput = Partial<CreateInterventionInput> & {
  status?: InterventionStatus
}

