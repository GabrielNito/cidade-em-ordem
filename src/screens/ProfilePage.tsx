'use client'

import { Check, ChevronRight, LogOut, ShieldCheck, UserRound, UsersRound, Wrench, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '../navigation'
import { useApp } from '../context/AppContext'
import type { UserRole } from '../types/domain'
import { pathForRole } from '../utils/report'

const roleOptions: Array<{ role: UserRole; label: string; description: string; icon: typeof UserRound }> = [
  { role: 'CITIZEN', label: 'Cidadão', description: 'Registrar e acompanhar ocorrências', icon: UserRound },
  { role: 'FIELD_AGENT', label: 'Equipe de campo', description: 'Atender e finalizar ordens de serviço', icon: Wrench },
  { role: 'MANAGER', label: 'Gestão', description: 'Acompanhar os indicadores da cidade', icon: UsersRound },
]

export function ProfilePage() {
  const { user, role, setRole, logout } = useApp()
  const navigate = useNavigate()
  const [isDemoModeOpen, setIsDemoModeOpen] = useState(false)
  const [largeText, setLargeText] = useState(false)
  const roleTriggerRef = useRef<HTMLButtonElement>(null)
  const closeRoleDialogRef = useRef<HTMLButtonElement>(null)
  const roleDialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const savedPreference = window.localStorage.getItem('cidade-em-ordem:large-text') === 'true'
    setLargeText(savedPreference)
    document.documentElement.dataset.readingSize = savedPreference ? 'large' : 'default'
  }, [])

  useEffect(() => {
    if (!isDemoModeOpen) return
    const triggerEl = roleTriggerRef.current
    closeRoleDialogRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsDemoModeOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const focusable = roleDialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      triggerEl?.focus()
    }
  }, [isDemoModeOpen])

  const toggleLargeText = () => {
    const nextValue = !largeText
    setLargeText(nextValue)
    window.localStorage.setItem('cidade-em-ordem:large-text', String(nextValue))
    document.documentElement.dataset.readingSize = nextValue ? 'large' : 'default'
  }

  const changeRole = (nextRole: UserRole) => {
    setRole(nextRole)
    setIsDemoModeOpen(false)
    navigate(pathForRole(nextRole))
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="content-stack profile-page">
      <div className="profile-heading">
        <p className="eyebrow">Conta</p>
        <h1>Perfil e acesso</h1>
        <p className="page-description">Consulte seus dados e ajuste a experiência de leitura.</p>
      </div>
      <section className="profile-card user-profile-card">
        <span className="profile-avatar"><UserRound size={26} /></span>
        <div><h2>{user.name}</h2><p>{user.email}</p></div>
        <span className="profile-verified"><ShieldCheck size={16} /> Acesso verificado</span>
      </section>
      <section className="profile-section reading-settings-section">
        <div className="reading-settings-copy">
          <span className="demo-mode-trigger-icon"><UserRound size={18} /></span>
          <span><strong>Leitura confortável</strong><small>Use texto maior para facilitar a leitura.</small></span>
        </div>
        <button type="button" className={`reading-size-toggle ${largeText ? 'reading-size-toggle-active' : ''}`} role="switch" aria-checked={largeText} onClick={toggleLargeText}>
          <span aria-hidden="true" />
          <span>{largeText ? 'Texto maior ativo' : 'Aumentar texto'}</span>
        </button>
      </section>
      <section className="profile-section demo-mode-section">
        <button ref={roleTriggerRef} type="button" className="demo-mode-trigger" onClick={() => setIsDemoModeOpen(true)}>
          <span className="demo-mode-trigger-icon"><ShieldCheck size={18} /></span>
          <span>
            <strong>Áreas do serviço</strong>
            <small>Acesse as visões de campo e gestão</small>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </section>
      <section className="profile-section profile-session-section">
        <div className="session-note"><ShieldCheck size={19} /><div><strong>Acesso protegido</strong><p>Seus chamados ficam disponíveis para consulta neste dispositivo.</p></div></div>
        <button className="logout-button" onClick={handleLogout}><LogOut size={18} /> Sair</button>
      </section>

      {isDemoModeOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setIsDemoModeOpen(false) }}>
          <section ref={roleDialogRef} className="demo-mode-modal" role="dialog" aria-modal="true" aria-labelledby="demo-mode-title">
            <div className="modal-heading">
              <div><p className="eyebrow">Perfis de acesso</p><h2 id="demo-mode-title">Escolha uma área</h2></div>
              <button ref={closeRoleDialogRef} type="button" className="icon-button" onClick={() => setIsDemoModeOpen(false)} aria-label="Fechar perfis de acesso"><X size={19} /></button>
            </div>
            <p className="modal-supporting-text">Cada área organiza as informações conforme a necessidade do serviço.</p>
            <div className="role-switcher">
              {roleOptions.map(({ role: optionRole, label, description, icon: Icon }) => {
                const active = role === optionRole
                return (
                  <button type="button" key={optionRole} className={`role-option ${active ? 'role-option-active' : ''}`} onClick={() => changeRole(optionRole)}>
                    <span className="role-option-icon"><Icon size={19} /></span>
                    <span><strong>{label}</strong><small>{description}</small></span>
                    {active ? <Check className="role-option-check" size={18} /> : null}
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
