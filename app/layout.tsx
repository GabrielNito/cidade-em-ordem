import type { Metadata } from 'next'
import { AppProviders } from '../src/components/auth/AppProviders'
import 'leaflet/dist/leaflet.css'
import '../src/styles.css'

export const metadata: Metadata = {
  title: 'Cidade em Ordem',
  description: 'Cidade em Ordem — zeladoria urbana em Indaiatuba.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  )
}
