'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { useParams, useRouter } from 'next/navigation'
import { MatchJSON } from '@/lib/types'

export default function AdminMatchDetailPage() {
  const { user, authHeader } = useApp()
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [match, setMatch] = useState<MatchJSON | null>(null)
  const [result, setResult] = useState<'team1' | 'team2' | 'draw'>('team1')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'admin') { router.push('/'); return }
    loadMatch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id])

  async function loadMatch() {
    for (const s of ['closed', 'open', 'settled']) {
      const res = await fetch(`/api/matches?status=${s}`, { headers: authHeader() })
      if (res.ok) {
        const arr: MatchJSON[] = await res.json()
        const found = arr.find((m) => m._id === id)
        if (found) { setMatch(found); break }
      }
    }
  }

  async function handleSettle(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ status: 'settled', result }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al declarar resultado')
        setSubmitting(false)
        return
      }
      setSuccess(true)
      setTimeout(() => router.push('/admin/matches'), 1500)
    } catch {
      setError('Error de conexión')
      setSubmitting(false)
    }
  }

  if (!user || user.role !== 'admin') return null
  if (!match) return <div style={{ textAlign: 'center', padding: '4rem', color: '#555' }}>Cargando...</div>

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '2rem 1rem' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        ← Volver
      </button>
      <div style={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Declarar resultado</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {match.team1} <strong style={{ color: '#00e676' }}>vs</strong> {match.team2}
        </p>

        {match.status !== 'closed' ? (
          <div style={{ background: '#ff980020', border: '1px solid #ff980030', borderRadius: '10px', padding: '1rem', color: '#ff9800', fontSize: '0.9rem' }}>
            Este partido no está en estado cerrado. Solo se pueden declarar resultados en partidos cerrados.
          </div>
        ) : success ? (
          <div style={{ background: '#00e67615', border: '1px solid #00e67630', borderRadius: '10px', padding: '1rem', color: '#00e676', textAlign: 'center' }}>
            ¡Resultado declarado! Pagos procesados. Redirigiendo...
          </div>
        ) : (
          <form onSubmit={handleSettle}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 500 }}>Resultado</label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {([
                  { value: 'team1', label: `Gana ${match.team1}` },
                  { value: 'draw', label: 'Empate' },
                  { value: 'team2', label: `Gana ${match.team2}` },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setResult(opt.value)}
                    style={{
                      flex: 1, minWidth: 100, padding: '12px 8px', borderRadius: '10px',
                      border: `2px solid ${result === opt.value ? '#00e676' : '#2a2a3a'}`,
                      background: result === opt.value ? '#00e67615' : '#0f0f14',
                      color: result === opt.value ? '#00e676' : '#888',
                      fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <div style={{ background: '#ff000015', border: '1px solid #ff000030', borderRadius: '8px', padding: '10px 14px', color: '#ff4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={submitting} style={{ width: '100%', padding: '13px', background: '#00e676', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Procesando...' : 'Declarar resultado y pagar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
