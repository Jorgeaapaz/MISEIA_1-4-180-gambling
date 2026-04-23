'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { useRouter } from 'next/navigation'

export default function NewMatchPage() {
  const { user, authHeader } = useApp()
  const router = useRouter()
  const [team1, setTeam1] = useState('')
  const [team2, setTeam2] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!user || user.role !== 'admin') {
    if (typeof window !== 'undefined') router.push('/')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ team1, team2 }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al crear el partido')
        setSubmitting(false)
        return
      }
      router.push('/admin/matches')
    } catch {
      setError('Error de conexión')
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: '#0f0f14',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '2rem 1rem' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        ← Volver
      </button>
      <div style={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '2rem' }}>
        <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Crear nuevo partido</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Equipo 1</label>
            <input type="text" value={team1} onChange={(e) => setTeam1(e.target.value)} placeholder="Ej: Real Madrid" required style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#00e676')} onBlur={(e) => (e.target.style.borderColor = '#2a2a3a')} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Equipo 2</label>
            <input type="text" value={team2} onChange={(e) => setTeam2(e.target.value)} placeholder="Ej: Barcelona" required style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#00e676')} onBlur={(e) => (e.target.style.borderColor = '#2a2a3a')} />
          </div>
          {error && (
            <div style={{ background: '#ff000015', border: '1px solid #ff000030', borderRadius: '8px', padding: '10px 14px', color: '#ff4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={submitting} style={{ width: '100%', padding: '13px', background: '#00e676', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Creando...' : 'Crear partido'}
          </button>
        </form>
      </div>
    </div>
  )
}
