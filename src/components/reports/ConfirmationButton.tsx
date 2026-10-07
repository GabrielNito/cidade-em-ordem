import { Check, UsersRound } from 'lucide-react'
import { useState } from 'react'
import type { Report, UserRole } from '../../types/domain'

export function ConfirmationButton({
  report,
  userId,
  role,
  onConfirm,
}: {
  report: Report
  userId: string
  role: UserRole
  onConfirm: (id: string) => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const confirmations = report.confirmations?.length ?? 0
  const hasConfirmed = report.confirmations?.includes(userId) ?? false
  const isOwner = report.citizen.id === userId
  const isFinalized = report.status === 'Finalizado'
  const canConfirm = role === 'CITIZEN' && !hasConfirmed && !isOwner && !isFinalized

  const handleConfirm = () => {
    setError('')
    setIsLoading(true)
    try {
      onConfirm(report.id)
    } catch (confirmationError) {
      setError(confirmationError instanceof Error ? confirmationError.message : 'Não foi possível confirmar a ocorrência.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="confirmation-action" aria-live="polite">
      <div className="confirmation-count"><UsersRound size={17} aria-hidden="true" /><strong>{confirmations}</strong><span>{confirmations === 1 ? 'pessoa confirmou' : 'pessoas confirmaram'}</span></div>
      {canConfirm ? (
        <button type="button" className="confirmation-button" onClick={handleConfirm} disabled={isLoading}>
          {isLoading ? <span className="button-spinner" aria-hidden="true" /> : null}
          {isLoading ? 'Confirmando...' : 'Também encontrei este problema'}
        </button>
      ) : hasConfirmed ? (
        <button type="button" className="confirmation-button confirmation-button-confirmed" disabled><Check size={16} /> Ocorrência confirmada</button>
      ) : isOwner ? (
        <p className="confirmation-note">Você registrou esta ocorrência.</p>
      ) : isFinalized ? (
        <p className="confirmation-note">A confirmação foi encerrada após a finalização.</p>
      ) : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </div>
  )
}

