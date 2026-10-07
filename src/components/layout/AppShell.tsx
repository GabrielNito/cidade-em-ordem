'use client'

import { ClipboardList, FileText, Landmark, LayoutDashboard, Map, Plus, UserRound, Wrench } from 'lucide-react'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import type { UserRole } from '../../types/domain'
import { BottomNavigation, type NavigationItem } from './BottomNavigation'
import { useApp } from '../../context/AppContext'
import { NavLink } from '../../navigation'

const roleCopy: Record<UserRole, { label: string; home: string; navigation: NavigationItem[] }> = {
  CITIZEN: {
    label: 'Área do cidadão',
    home: '/app/mapa',
    navigation: [
      { to: '/app/mapa', label: 'Mapa', icon: Map, end: true },
      { to: '/app/chamados', label: 'Chamados', icon: FileText },
      { to: '/app/perfil', label: 'Perfil', icon: UserRound },
    ],
  },
  FIELD_AGENT: {
    label: 'Operação de campo',
    home: '/campo/ordens',
    navigation: [
      { to: '/campo/ordens', label: 'Ordens', icon: ClipboardList, end: true },
      { to: '/campo/perfil', label: 'Perfil', icon: UserRound },
    ],
  },
  MANAGER: {
    label: 'Gestão municipal',
    home: '/gestao/dashboard',
    navigation: [
      { to: '/gestao/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/gestao/perfil', label: 'Perfil', icon: UserRound },
    ],
  },
}

function Sidebar({ role }: { role: UserRole }) {
  const copy = roleCopy[role]
  return (
    <aside className="desktop-sidebar">
      <NavLink to={copy.home} className="sidebar-brand">
        <span className="brand-mark brand-mark-logo"><img src="/image%208.png" alt="" /></span>
        <span>
          <strong>Cidade em Ordem</strong>
          <small>Indaiatuba</small>
        </span>
      </NavLink>
      <div className="sidebar-context">
        <span className="sidebar-context-icon"><Wrench size={15} /></span>
        <div>
          <span>Contexto atual</span>
          <strong>{copy.label}</strong>
        </div>
      </div>
      {role === 'CITIZEN' ? (
        <NavLink to="/app/nova-ocorrencia" className="sidebar-primary-action">
          <Plus size={17} strokeWidth={2} />
          <span>Nova ocorrência</span>
        </NavLink>
      ) : null}
      <nav className="sidebar-nav" aria-label="Navegação da área">
        {copy.navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `sidebar-nav-link ${isActive ? 'sidebar-nav-link-active' : ''}`}>
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span className="municipal-seal-placeholder"><Landmark size={17} /></span>
        <span>Protótipo de demonstração</span>
      </div>
    </aside>
  )
}

function Topbar({ role }: { role: UserRole }) {
  const { user } = useApp()
  const pathname = usePathname() ?? ''
  const copy = roleCopy[role]
  const profilePath = role === 'CITIZEN' ? '/app/perfil' : role === 'FIELD_AGENT' ? '/campo/perfil' : '/gestao/perfil'
  const isProfile = pathname === profilePath
  return (
    <header className="topbar">
      <div className="mobile-brand">
        <NavLink to={copy.home} className="brand-inline">
          <span className="brand-mark brand-mark-small brand-mark-logo"><img src="/image%208.png" alt="" /></span>
          <span>Cidade em Ordem</span>
        </NavLink>
      </div>
      <div className="topbar-context">{copy.label}</div>
      <NavLink to={profilePath} className={`topbar-user ${isProfile ? 'topbar-user-active' : ''}`} aria-label="Abrir perfil">
        <span className="avatar">{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
        <span className="topbar-user-name">{user.name.split(' ')[0]}</span>
        <UserRound size={16} aria-hidden="true" />
      </NavLink>
    </header>
  )
}

export function AppShell({ role, children }: { role: UserRole; children: ReactNode }) {
  const copy = roleCopy[role]
  const pathname = usePathname() ?? ''
  const isReportFlow = role === 'CITIZEN' && pathname.startsWith('/app/nova-ocorrencia')
  return (
    <div className="app-shell">
      <Sidebar role={role} />
      <div className="app-main">
        <Topbar role={role} />
        <main className="page-main">{children}</main>
        {isReportFlow ? null : <BottomNavigation items={copy.navigation} showFab={role === 'CITIZEN'} />}
      </div>
    </div>
  )
}
