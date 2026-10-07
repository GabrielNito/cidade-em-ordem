import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DEMO_CITIZEN } from '../data/mockReports'
import { INITIAL_NOTIFICATIONS } from '../data/mockNotifications'
import { reportRepository } from '../services/reportRepository'
import type { AppNotification, CreateReportInput, Report, UserRole } from '../types/domain'

const SESSION_STORAGE_KEY = 'cidade-em-ordem:session:v1'
const NOTIFICATIONS_STORAGE_KEY = 'cidade-em-ordem:notifications:v1'

interface Session {
  user: typeof DEMO_CITIZEN
  role: UserRole
}

interface AppContextValue {
  authenticated: boolean
  isHydrated: boolean
  user: typeof DEMO_CITIZEN
  role: UserRole
  reports: Report[]
  isLoading: boolean
  notifications: AppNotification[]
  unreadNotificationsCount: number
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  clearNotifications: () => void
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt'>) => void
  login: () => Promise<void>
  logout: () => void
  setRole: (role: UserRole) => void
  createReport: (input: Omit<CreateReportInput, 'citizen'>) => Report
  confirmReport: (id: string) => Report
  assignReport: (id: string, assignedTo: string) => Report
  startReport: (id: string) => Report
  finishReport: (id: string, completionPhoto: string) => Report
  refreshReports: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function getStoredSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as { user?: typeof DEMO_CITIZEN; role?: string }
    if (!parsed.user) return null
    const role = parsed.role === 'FIELD_AGENT' || parsed.role === 'field'
      ? 'FIELD_AGENT'
      : parsed.role === 'MANAGER' || parsed.role === 'management'
        ? 'MANAGER'
        : 'CITIZEN'
    return { user: parsed.user, role }
  } catch {
    return null
  }
}

function saveSession(session: Session) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

function getStoredNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    if (!stored) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS))
      return INITIAL_NOTIFICATIONS
    }
    return JSON.parse(stored) as AppNotification[]
  } catch {
    return INITIAL_NOTIFICATIONS
  }
}

function saveNotifications(notifications: AppNotification[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  // Keep the server render and the browser's first render identical. The
  // repository reads localStorage only after the client has hydrated.
  const [reports, setReports] = useState<Report[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const refreshReports = () => setReports(reportRepository.list())
  const refreshNotifications = () => setNotifications(getStoredNotifications())

  useEffect(() => {
    setSession(getStoredSession())
    refreshReports()
    refreshNotifications()
    const largeText = window.localStorage.getItem('cidade-em-ordem:large-text') === 'true'
    document.documentElement.dataset.readingSize = largeText ? 'large' : 'default'
    setIsHydrated(true)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'cidade-em-ordem:reports:v1') refreshReports()
      if (event.key === NOTIFICATIONS_STORAGE_KEY) refreshNotifications()
      if (event.key === SESSION_STORAGE_KEY) setSession(getStoredSession())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const login = async () => {
    setIsLoading(true)
    await new Promise((resolve) => window.setTimeout(resolve, 700))
    const newSession: Session = { user: DEMO_CITIZEN, role: 'CITIZEN' }
    saveSession(newSession)
    setSession(newSession)
    setIsLoading(false)
  }

  const logout = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(SESSION_STORAGE_KEY)
    setSession(null)
  }

  const setRole = (role: UserRole) => {
    if (!session) return
    const nextSession = { ...session, role }
    saveSession(nextSession)
    setSession(nextSession)
  }

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      saveNotifications(updated)
      return updated
    })
  }

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((item) => ({ ...item, read: true }))
      saveNotifications(updated)
      return updated
    })
  }

  const clearNotifications = () => {
    setNotifications([])
    saveNotifications([])
  }

  const addNotification = (input: Omit<AppNotification, 'id' | 'createdAt'>) => {
    const newNotif: AppNotification = {
      ...input,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    }
    setNotifications((prev) => {
      const updated = [newNotif, ...prev]
      saveNotifications(updated)
      return updated
    })
  }

  const createReport = (input: Omit<CreateReportInput, 'citizen'>) => {
    const created = reportRepository.create({ ...input, citizen: session?.user ?? DEMO_CITIZEN })
    refreshReports()
    addNotification({
      type: 'STATUS_UPDATE',
      title: 'Chamado registrado com sucesso',
      message: `Seu chamado de ${input.category} (${created.protocol}) foi recebido pelo setor de Zeladoria Urbana de Indaiatuba.`,
      protocol: created.protocol,
      reportId: created.id,
      read: false,
    })
    return created
  }

  const confirmReport = (id: string) => {
    if (!session || session.role !== 'CITIZEN') {
      throw new Error('Somente cidadãos podem confirmar ocorrências.')
    }
    const updated = reportRepository.confirm(id, session.user.id)
    refreshReports()
    addNotification({
      type: 'COMMUNITY_SUPPORT',
      title: 'Você apoiou uma ocorrência',
      message: `Sua confirmação adicionou prioridade pública ao chamado ${updated.protocol} (${updated.category}).`,
      protocol: updated.protocol,
      reportId: updated.id,
      read: false,
    })
    return updated
  }

  const assignReport = (id: string, assignedTo: string) => {
    const updated = reportRepository.assign(id, assignedTo)
    refreshReports()
    return updated
  }

  const startReport = (id: string) => {
    const updated = reportRepository.start(id)
    refreshReports()
    return updated
  }

  const finishReport = (id: string, completionPhoto: string) => {
    const updated = reportRepository.finish(id, completionPhoto)
    refreshReports()
    return updated
  }

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length

  const value: AppContextValue = {
    authenticated: Boolean(session),
    isHydrated,
    user: session?.user ?? DEMO_CITIZEN,
    role: session?.role ?? 'CITIZEN',
    reports,
    isLoading,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    addNotification,
    login,
    logout,
    setRole,
    createReport,
    confirmReport,
    assignReport,
    startReport,
    finishReport,
    refreshReports,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp precisa ser usado dentro de AppProvider.')
  return context
}
