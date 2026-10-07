import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function LoadingButton({ loading, children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; children: ReactNode }) {
  return (
    <button {...props} className={`button-primary ${className}`} disabled={loading || props.disabled}>
      {loading ? <LoaderCircle className="animate-spin" size={18} aria-hidden="true" /> : null}
      {loading ? 'Aguarde...' : children}
    </button>
  )
}
