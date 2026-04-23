'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function formatCents(cents: number) {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

interface Reports {
  totalBets: number
  totalWageredCents: number
  totalPayoutCents: number
  pendingBets: number
  wonBets: number
  lostBets: number
  refundedBets: number
  matchSummary: { open: number; closed: number; settled: number }
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      background: '#1a1a24',
      border: `1px solid ${accent ? '#00e67630' : '#2a2a3a'}`,
      borderRadius: '12px',
      padding: '1.25rem 1.5rem',
    }}>
      <div style={{ color: '#666', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ color: accent ? '#00e676' : '#fff', fontWeight: 800, fontSize: '1.5rem' }}>{value}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user, authHeader } = useApp()
  const router = useRouter()
  const [reports, setReports] = useState<Reports | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'admin') { router.push('/'); return }
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadReports() {
    try {
      const res = await fetch('/api/admin/reports', { headers: authHeader() })
      if (res.ok) setReports(await res.json())
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== 'admin') return null

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#fff' }}>Dashboard Admin</h1>
          <p style={{ color: '#666', marginTop: '0.25rem' }}>Resumen del sistema</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/admin/matches" style={{ padding: '10px 18px', background: '#1a1a24', border: '1px solid #2a2a3a', color: '#ccc', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
            Partidos
          </Link>
          <Link href="/admin/matches/new" style={{ padding: '10px 18px', background: '#00e676', color: '#000', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
            + Nuevo partido
          </Link>
          <Link href="/admin/users" style={{ padding: '10px 18px', background: '#1a1a24', border: '1px solid #2a2a3a', color: '#ccc', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
            Usuarios
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#555' }}>Cargando...</div>
      ) : reports ? (
        <>
          <h2 style={{ color: '#888', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Apuestas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard label="Total apuestas" value={String(reports.totalBets)} />
            <StatCard label="Total apostado" value={formatCents(reports.totalWageredCents)} accent />
            <StatCard label="Total pagado" value={formatCents(reports.totalPayoutCents)} />
            <StatCard label="Pendientes" value={String(reports.pendingBets)} />
            <StatCard label="Ganadas" value={String(reports.wonBets)} accent />
            <StatCard label="Perdidas" value={String(reports.lostBets)} />
            <StatCard label="Reembolsadas" value={String(reports.refundedBets)} />
          </div>

          <h2 style={{ color: '#888', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Partidos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            <StatCard label="Abiertos" value={String(reports.matchSummary.open)} accent />
            <StatCard label="Cerrados" value={String(reports.matchSummary.closed)} />
            <StatCard label="Resueltos" value={String(reports.matchSummary.settled)} />
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', color: '#555' }}>No se pudieron cargar los datos</div>
      )}
    </div>
  )
}
