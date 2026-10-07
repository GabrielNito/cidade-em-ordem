'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import type { UserRole } from '../../types/domain'
import { roleCanAccess } from '../../utils/access'
import { pathForRole } from '../../utils/report'

export function RoleGate({ role, children }: { role: UserRole; children: ReactNode }) {
  const { authenticated, isHydrated, role: currentRole } = useApp()
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const canAccess = authenticated && roleCanAccess(currentRole, role)

  useEffect(() => {
    if (!isHydrated) return
    if (!authenticated) {
      if (pathname !== '/login') router.replace('/login')
      return
    }
    if (!roleCanAccess(currentRole, role)) {
      const target = pathForRole(currentRole)
      if (pathname !== target) router.replace(target)
    }
  }, [authenticated, currentRole, isHydrated, pathname, role, router])

  if (!isHydrated || !canAccess) {
    return <div className="route-loading" aria-live="polite">Carregando acesso…</div>
  }

  return <>{children}</>
}
