'use client'

import { Building2, ShieldCheck } from 'lucide-react'
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
          <div className="service-wordmark" aria-label="Cidade em Ordem">
            <span className="service-wordmark-line" aria-hidden="true" />
            <span><strong>CIDADE</strong><em>EM ORDEM</em></span>
          </div>
          <p className="login-service-description">Serviços de zeladoria urbana em Indaiatuba</p>
        </div>
        <div className="login-actions">
          <button className="gov-button" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? <span className="button-spinner" aria-hidden="true" /> : null}
            <span>{isLoading ? 'Conectando...' : <>Entrar com <strong>gov.br</strong></>}</span>
          </button>
          {error ? <p className="form-error standalone-error" role="alert">{error}</p> : null}
          <p className="login-support">Clique aqui para entrar utilizando sua conta <strong>gov.br</strong></p>
          <div className="login-demo-note">
            <ShieldCheck size={15} aria-hidden="true" />
            <span>Acesso simulado para demonstração. Nenhum CPF ou senha é solicitado.</span>
          </div>
        </div>
      </section>
    </main>
  )
}
