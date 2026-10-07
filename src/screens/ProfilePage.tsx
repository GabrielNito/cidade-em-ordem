'use client'

import { Check, ChevronRight, LogOut, ShieldCheck, UserRound, UsersRound, Wrench, X } from 'lucide-react'
import { useState } from 'react'
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
        <p className="page-description">Consulte seus dados e as opções desta demonstração.</p>
      </div>
      <section className="profile-card user-profile-card">
        <span className="profile-avatar"><UserRound size={26} /></span>
        <div><h2>{user.name}</h2><p>{user.email}</p></div>
        <span className="profile-verified"><ShieldCheck size={16} /> Acesso simulado</span>
      </section>
      <section className="profile-section demo-mode-section">
        <button type="button" className="demo-mode-trigger" onClick={() => setIsDemoModeOpen(true)}>
          <span className="demo-mode-trigger-icon"><ShieldCheck size={18} /></span>
          <span>
            <strong>Modo de demonstração</strong>
            <small>Alternar contexto do protótipo</small>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <p className="demo-mode-note">Disponível apenas nesta versão de demonstração.</p>
      </section>
      <section className="profile-section profile-session-section">
        <div className="session-note"><ShieldCheck size={19} /><div><strong>Sessão local ativa</strong><p>Os dados desta demonstração ficam salvos apenas neste navegador.</p></div></div>
        <button className="logout-button" onClick={handleLogout}><LogOut size={18} /> Sair da demonstração</button>
      </section>

      {isDemoModeOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setIsDemoModeOpen(false) }}>
          <section className="demo-mode-modal" role="dialog" aria-modal="true" aria-labelledby="demo-mode-title">
            <div className="modal-heading">
              <div><p className="eyebrow">Demonstração</p><h2 id="demo-mode-title">Simular acesso como</h2></div>
              <button type="button" className="icon-button" onClick={() => setIsDemoModeOpen(false)} aria-label="Fechar modo de demonstração"><X size={19} /></button>
            </div>
            <p className="modal-supporting-text">Disponível apenas nesta versão de demonstração.</p>
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
