'use client'

import { Building2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from '../navigation'
import { useApp } from '../context/AppContext'
import { pathForRole } from '../utils/report'

export function LoginPage() {
  const { login, isLoading } = useApp()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    try {
      await login()
      navigate(pathForRole('CITIZEN'))
    } catch {
      setError('Não foi possível iniciar a demonstração. Tente novamente.')
    }
  }

  return (
    <main className="login-page">
      <section className="login-screen" aria-label="Acesso ao Cidade em Ordem">
        <div className="login-institution">
          <Building2 size={15} strokeWidth={1.7} aria-hidden="true" />
          <span>Prefeitura de Indaiatuba</span>
        </div>
        <div className="login-brand-area">
          <div className="login-logo-wrap" aria-label="Cidade em Ordem">
            <img src="/image%208.png" alt="Cidade em Ordem - Indaiatuba" className="login-logo-img" />
          </div>
          <p className="login-service-description"><strong>Bem-vinda ao Cidade em Ordem.</strong> Serviços de zeladoria urbana em Indaiatuba.</p>
        </div>
        <div className="login-actions">
          <button className="gov-button" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? <span className="button-spinner" aria-hidden="true" /> : null}
            <span>{isLoading ? 'Conectando...' : <>Entrar com <strong>gov.br</strong></>}</span>
          </button>
          {error ? <p className="form-error standalone-error" role="alert">{error}</p> : null}
          <p className="login-support">Entre com sua conta <strong>gov.br</strong> para registrar e acompanhar suas solicitações.</p>
        </div>
      </section>
    </main>
  )
}
