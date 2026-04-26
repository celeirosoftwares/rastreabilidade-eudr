import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RastreiO — Rastreabilidade EUDR',
  description: 'Plataforma brasileira de rastreabilidade agrícola para conformidade com o Regulamento EUDR da União Europeia.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
