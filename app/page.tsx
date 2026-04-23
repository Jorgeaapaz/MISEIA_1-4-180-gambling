'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import { MatchJSON } from '@/lib/types'
import { useRouter } from 'next/navigation'

function TeamBadge({ name }: { name: string }) {
  const colors = ['#1565c0', '#b71c1c', '#1b5e20', '#4a148c', '#e65100', '#006064']
  const idx = name.charCodeAt(0) % colors.length
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: colors[idx],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: '1.1rem',
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    open: { bg: '#00e67620', color: '#00e676', label: 'ABIERTO' },
    closed: { bg: '#ff980020', color: '#ff9800', label: 'CERRADO' },
    settled: { bg: '#9e9e9e20', color: '#9e9e9e', label: 'RESUELTO' },
  }
  const s = styles[status] || styles.settled
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: '2px 10px',
        borderRadius: '20px',
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.5px',
      }}
    >
      {s.label}
    </span>
  )
}

export default function HomePage() {
  const { user, authHeader } = useApp()
  const router = useRouter()
  const [matches, setMatches] = useState<MatchJSON[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('open')

  useEffect(() => {
    if (user === null && typeof window !== 'undefined' && !localStorage.getItem('session_token')) {
      router.push('/login')
    }
  }, [user, router])

  useEffect(() => {
    if (user) loadMatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter])

  async function loadMatches() {
    setLoading(true)
    try {
      const res = await fetch(`/api/matches?status=${filter}`, { headers: authHeader() })
      if (res.ok) setMatches(await res.json())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
          Partidos
        </h1>
        <p style={{ color: '#666', marginTop: '0.25rem' }}>Elige tu apuesta y gana</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['open', 'closed', 'settled'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              background: filter === s ? '#00e676' : '#1a1a24',
              color: filter === s ? '#000' : '#888',
              transition: 'all 0.15s',
            }}
          >
            {s === 'open' ? 'Abiertos' : s === 'closed' ? 'Cerrados' : 'Resueltos'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#555' }}>Cargando partidos...</div>
      ) : matches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#1a1a24', borderRadius: '12px', color: '#555' }}>
          No hay partidos {filter === 'open' ? 'abiertos' : filter === 'closed' ? 'cerrados' : 'resueltos'}.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {matches.map((match) => (
            <Link key={match._id} href={`/matches/${match._id}`} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: '#1a1a24',
                  border: '1px solid #2a2a3a',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00e676')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2a2a3a')}
              >
                <TeamBadge name={match.team1} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{match.team1}</span>
                    <span style={{ color: '#444', fontWeight: 700 }}>VS</span>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{match.team2}</span>
                    <StatusBadge status={match.status} />
                  </div>
                  {match.result && (
                    <div style={{ fontSize: '0.85rem', color: '#00e676' }}>
                      Resultado: {match.result === 'team1' ? match.team1 : match.result === 'team2' ? match.team2 : 'Empate'}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.25rem' }}>
                    {new Date(match.createdAt).toLocaleDateString('es-ES')}
                  </div>
                </div>
                <TeamBadge name={match.team2} />
                {match.status === 'open' && (
                  <div style={{ background: '#00e676', color: '#000', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    Apostar →
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
