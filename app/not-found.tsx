import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="route-not-found">
      <p className="eyebrow">Cidade em Ordem</p>
      <h1>Página não encontrada</h1>
      <p>O endereço informado não corresponde a uma tela disponível.</p>
      <Link href="/" className="button-primary">Voltar ao início</Link>
    </main>
  )
}
