'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MatchJSON } from '@/lib/types'

export default function AdminMatchesPage() {
  const { user, authHeader } = useApp()
  const router = useRouter()
  const [matches, setMatches] = useState<MatchJSON[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'admin') { router.push('/'); return }
    loadMatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadMatches() {
    try {
      const [open, closed, settled] = await Promise.all([
        fetch('/api/matches?status=open', { headers: authHeader() }).then((r) => r.json()),
        fetch('/api/matches?status=closed', { headers: authHeader() }).then((r) => r.json()),
        fetch('/api/matches?status=settled', { headers: authHeader() }).then((r) => r.json()),
      ])
      setMatches([...open, ...closed, ...settled])
    } finally {
      setLoading(false)
    }
  }

  async function closeMatch(id: string) {
    await fetch(`/api/matches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ status: 'closed' }),
    })
    loadMatches()
  }

  if (!user || user.role !== 'admin') return null

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#fff' }}>Gestión de partidos</h1>
        </div>
        <Link href="/admin/matches/new" style={{ padding: '10px 18px', background: '#00e676', color: '#000', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
          + Nuevo partido
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#555' }}>Cargando...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {matches.map((match) => (
            <div key={match._id} style={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                  {match.team1} <span style={{ color: '#444' }}>vs</span> {match.team2}
                </div>
                <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {match.status === 'settled' && match.result && `Resultado: ${match.result === 'team1' ? match.team1 : match.result === 'team2' ? match.team2 : 'Empate'}`}
                </div>
              </div>
              <span style={{
                padding: '3px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                background: match.status === 'open' ? '#00e67620' : match.status === 'closed' ? '#ff980020' : '#9e9e9e20',
                color: match.status === 'open' ? '#00e676' : match.status === 'closed' ? '#ff9800' : '#9e9e9e',
              }}>
                {match.status.toUpperCase()}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {match.status === 'open' && (
                  <button onClick={() => closeMatch(match._id)} style={{ padding: '7px 14px', background: '#ff9800', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                    Cerrar
                  </button>
                )}
                {match.status === 'closed' && (
                  <Link href={`/admin/matches/${match._id}`} style={{ padding: '7px 14px', background: '#00e676', color: '#000', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                    Declarar resultado
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
