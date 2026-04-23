'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { useRouter } from 'next/navigation'
import { BetJSON } from '@/lib/types'

function formatCents(cents: number) {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: '#ff980020', color: '#ff9800', label: 'PENDIENTE' },
    won: { bg: '#00e67620', color: '#00e676', label: 'GANADA' },
    lost: { bg: '#ff000020', color: '#ff4444', label: 'PERDIDA' },
    refunded: { bg: '#9e9e9e20', color: '#9e9e9e', label: 'REEMBOLSADA' },
  }
  const s = styles[status] || styles.pending
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
      {s.label}
    </span>
  )
}

export default function MyBetsPage() {
  const { user, authHeader } = useApp()
  const router = useRouter()
  const [bets, setBets] = useState<BetJSON[]>([])
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadData() {
    try {
      const [betsRes, profileRes] = await Promise.all([
        fetch('/api/bets', { headers: authHeader() }),
        fetch('/api/admin/users', { headers: authHeader() }),
      ])
      if (betsRes.ok) setBets(await betsRes.json())
      // Get own balance from admin/users if admin, otherwise from session
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: 800, color: '#fff' }}>Mis Apuestas</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Historial completo de tus apuestas</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#555' }}>Cargando...</div>
      ) : bets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#1a1a24', borderRadius: '12px', color: '#555' }}>
          No has realizado ninguna apuesta aún.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {bets.map((bet) => (
            <div
              key={bet._id}
              style={{
                background: '#1a1a24',
                border: '1px solid #2a2a3a',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <StatusBadge status={bet.status} />
                  <span style={{ color: '#888', fontSize: '0.85rem' }}>
                    Pick: <strong style={{ color: '#ccc' }}>{bet.pick === 'draw' ? 'Empate' : bet.pick === 'team1' ? 'Equipo 1' : 'Equipo 2'}</strong>
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#555' }}>
                  {new Date(bet.createdAt).toLocaleString('es-ES')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                  {formatCents(bet.amountCents)}
                </div>
                {bet.payoutCents != null && bet.status !== 'lost' && (
                  <div style={{ fontSize: '0.85rem', color: bet.status === 'won' ? '#00e676' : bet.status === 'refunded' ? '#9e9e9e' : '#888' }}>
                    {bet.status === 'won' ? `+${formatCents(bet.payoutCents)}` : bet.status === 'refunded' ? `Devuelto: ${formatCents(bet.payoutCents)}` : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
