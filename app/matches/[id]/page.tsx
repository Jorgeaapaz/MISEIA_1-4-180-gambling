'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { MatchJSON } from '@/lib/types'

function TeamBadge({ name, size = 64 }: { name: string; size?: number }) {
  const colors = ['#1565c0', '#b71c1c', '#1b5e20', '#4a148c', '#e65100', '#006064']
  const idx = name.charCodeAt(0) % colors.length
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: colors[idx],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: size * 0.3,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, authHeader } = useApp()
  const router = useRouter()
  const [match, setMatch] = useState<MatchJSON | null>(null)
  const [pick, setPick] = useState<'team1' | 'team2' | 'draw' | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [redsysForm, setRedsysForm] = useState<{
    url: string
    Ds_SignatureVersion: string
    Ds_MerchantParameters: string
    Ds_Signature: string
  } | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadMatch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id])

  async function loadMatch() {
    try {
      const res = await fetch(`/api/matches?status=open`, { headers: authHeader() })
      if (res.ok) {
        const allMatches: MatchJSON[] = await res.json()
        const found = allMatches.find((m) => m._id === id)
        if (!found) {
          // Try other statuses
          for (const s of ['closed', 'settled']) {
            const r2 = await fetch(`/api/matches?status=${s}`, { headers: authHeader() })
            if (r2.ok) {
              const arr: MatchJSON[] = await r2.json()
              const f2 = arr.find((m) => m._id === id)
              if (f2) { setMatch(f2); break }
            }
          }
        } else {
          setMatch(found)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleBet(e: React.FormEvent) {
    e.preventDefault()
    if (!pick || !amount) return
    setSubmitting(true)
    setError('')

    const amountCents = Math.round(parseFloat(amount) * 100)
    if (amountCents < 100) {
      setError('El mínimo es 1.00€')
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ matchId: id, pick, amountCents }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al crear la apuesta')
        setSubmitting(false)
        return
      }
      setRedsysForm(data.redsysForm)
    } catch {
      setError('Error de conexión')
      setSubmitting(false)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#555' }}>Cargando...</div>
  if (!match) return <div style={{ textAlign: 'center', padding: '4rem', color: '#555' }}>Partido no encontrado</div>

  const resultLabel = match.result === 'team1' ? match.team1 : match.result === 'team2' ? match.team2 : match.result === 'draw' ? 'Empate' : null

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1rem' }}>
      <button
        onClick={() => router.back()}
        style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem' }}
      >
        ← Volver
      </button>

      {/* Match header */}
      <div
        style={{
          background: '#1a1a24',
          border: '1px solid #2a2a3a',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <TeamBadge name={match.team1} size={72} />
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff', marginTop: '0.5rem' }}>{match.team1}</div>
          </div>
          <div style={{ color: '#555', fontWeight: 700, fontSize: '1.5rem' }}>VS</div>
          <div style={{ textAlign: 'center' }}>
            <TeamBadge name={match.team2} size={72} />
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff', marginTop: '0.5rem' }}>{match.team2}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{
            background: match.status === 'open' ? '#00e67620' : match.status === 'closed' ? '#ff980020' : '#9e9e9e20',
            color: match.status === 'open' ? '#00e676' : match.status === 'closed' ? '#ff9800' : '#9e9e9e',
            padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
          }}>
            {match.status === 'open' ? 'ABIERTO' : match.status === 'closed' ? 'CERRADO' : 'RESUELTO'}
          </span>
          {resultLabel && (
            <span style={{ background: '#00e67615', color: '#00e676', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
              Ganó: {resultLabel}
            </span>
          )}
        </div>
      </div>

      {/* Bet form */}
      {match.status === 'open' && !redsysForm && (
        <div style={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '2rem' }}>
          <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
            Realizar apuesta
          </h2>
          <form onSubmit={handleBet}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 500 }}>
                ¿A quién apuestas?
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {([
                  { value: 'team1', label: match.team1 },
                  { value: 'draw', label: 'Empate' },
                  { value: 'team2', label: match.team2 },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPick(opt.value)}
                    style={{
                      flex: 1,
                      minWidth: 100,
                      padding: '14px 12px',
                      borderRadius: '10px',
                      border: `2px solid ${pick === opt.value ? '#00e676' : '#2a2a3a'}`,
                      background: pick === opt.value ? '#00e67615' : '#0f0f14',
                      color: pick === opt.value ? '#00e676' : '#888',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontSize: '0.95rem',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                Importe (€)
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10.00"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#0f0f14',
                  border: '1px solid #2a2a3a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#00e676')}
                onBlur={(e) => (e.target.style.borderColor = '#2a2a3a')}
              />
              <div style={{ color: '#555', fontSize: '0.78rem', marginTop: '0.25rem' }}>Mínimo: 1.00€</div>
            </div>

            {error && (
              <div style={{ background: '#ff000015', border: '1px solid #ff000030', borderRadius: '8px', padding: '10px 14px', color: '#ff4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !pick}
              style={{
                width: '100%',
                padding: '14px',
                background: '#00e676',
                color: '#000',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: submitting || !pick ? 'not-allowed' : 'pointer',
                opacity: submitting || !pick ? 0.6 : 1,
              }}
            >
              {submitting ? 'Procesando...' : 'Continuar al pago →'}
            </button>
          </form>
        </div>
      )}

      {/* REDSYS redirect form */}
      {redsysForm && (
        <div style={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#00e676', fontWeight: 700, marginBottom: '1rem' }}>
            ¡Apuesta creada! Redirigiendo al TPV...
          </p>
          <form id="redsys-form" method="POST" action={redsysForm.url}>
            <input type="hidden" name="Ds_SignatureVersion" value={redsysForm.Ds_SignatureVersion} />
            <input type="hidden" name="Ds_MerchantParameters" value={redsysForm.Ds_MerchantParameters} />
            <input type="hidden" name="Ds_Signature" value={redsysForm.Ds_Signature} />
            <button
              type="submit"
              style={{
                padding: '14px 28px',
                background: '#00e676',
                color: '#000',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Pagar ahora con REDSYS →
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
