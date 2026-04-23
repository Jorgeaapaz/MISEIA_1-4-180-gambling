import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/context/AppContext'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'GamblingApp — Apuestas Deportivas',
  description: 'Sistema de apuestas deportivas con pagos en tiempo real',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" style={{ height: '100%' }}>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#0f0f14',
          color: '#e0e0e0',
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        }}
      >
        <AppProvider>
          <Navbar />
          <main style={{ minHeight: 'calc(100vh - 64px)' }}>{children}</main>
        </AppProvider>
      </body>
    </html>
  )
}
