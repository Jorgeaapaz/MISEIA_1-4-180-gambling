'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

export default function LoginPage() {
  const { user } = useApp()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (user) {
    router.push('/')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Error al enviar el magic link')
        setStatus('error')
      } else {
        setStatus('sent')
      }
    } catch {
      setErrorMsg('Error de conexión')
      setStatus('error')
    }
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          background: '#1a1a24',
          border: '1px solid #2a2a3a',
          borderRadius: '16px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: 420,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚽</div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
            GamblingApp
          </h1>
          <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Accede con tu correo electrónico
          </p>
        </div>

        {status === 'sent' ? (
          <div
            style={{
              background: '#00e67615',
              border: '1px solid #00e67630',
              borderRadius: '10px',
              padding: '1.5rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📧</div>
            <p style={{ color: '#00e676', fontWeight: 600, margin: 0 }}>
              ¡Correo enviado!
            </p>
            <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Revisa tu bandeja de entrada y haz clic en el enlace de acceso.
              El enlace expira en 15 minutos.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
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
            </div>

            {status === 'error' && (
              <div
                style={{
                  background: '#ff000015',
                  border: '1px solid #ff000030',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#ff4444',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                width: '100%',
                padding: '13px',
                background: '#00e676',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                opacity: status === 'loading' ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {status === 'loading' ? 'Enviando...' : 'Enviar magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
