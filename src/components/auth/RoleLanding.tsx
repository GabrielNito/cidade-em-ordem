'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { pathForRole } from '../../utils/report'

export function RoleLanding() {
  const { authenticated, isHydrated, role } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!isHydrated) return
    router.replace(authenticated ? pathForRole(role) : '/login')
  }, [authenticated, isHydrated, role, router])

  return <div className="route-loading" aria-live="polite">Carregando acesso…</div>
}
