'use client'

import { Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from '../../navigation'

export interface NavigationItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export function BottomNavigation({ items, showFab = false }: { items: NavigationItem[]; showFab?: boolean }) {
  const renderItem = ({ to, label, icon: Icon, end }: NavigationItem) => (
    <NavLink key={to} to={to} end={end} className={({ isActive }) => `bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`}>
      <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  )

  return (
    <nav className={`bottom-navigation ${showFab ? 'bottom-navigation-with-fab' : ''}`} aria-label="Navegação principal">
      {showFab ? <div className="bottom-nav-links">{items.map(renderItem)}</div> : items.map(renderItem)}
      {showFab ? (
        <div className="bottom-fab-slot">
          <NavLink to="/app/nova-ocorrencia" className="bottom-fab" aria-label="Nova ocorrência">
            <span className="bottom-fab-icon" aria-hidden="true">
              <Plus size={24} strokeWidth={1.8} />
            </span>
            <span className="bottom-fab-label">Novo</span>
          </NavLink>
        </div>
      ) : null}
    </nav>
  )
}
