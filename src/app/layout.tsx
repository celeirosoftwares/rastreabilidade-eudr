import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RastreiO — Rastreabilidade EUDR',
  description: 'Plataforma de rastreabilidade agrícola para conformidade com o Regulamento EUDR.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
