'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { Suspense } from 'react'

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { login } = useApp()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setErrorMsg('Token no encontrado en la URL')
      setStatus('error')
      return
    }
    verify(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function verify(token: string) {
    try {
      const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Token inválido')
        setStatus('error')
      } else {
        login(data.token, data.user)
        setStatus('success')
        setTimeout(() => router.push('/'), 1500)
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
      }}
    >
      <div
        style={{
          background: '#1a1a24',
          border: '1px solid #2a2a3a',
          borderRadius: '16px',
          padding: '2.5rem',
          textAlign: 'center',
          maxWidth: 380,
          width: '100%',
        }}
      >
        {status === 'loading' && (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔐</div>
            <p style={{ color: '#888' }}>Verificando tu acceso...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅</div>
            <p style={{ color: '#00e676', fontWeight: 700, fontSize: '1.1rem' }}>¡Acceso concedido!</p>
            <p style={{ color: '#666', fontSize: '0.85rem' }}>Redirigiendo...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
            <p style={{ color: '#ff4444', fontWeight: 700 }}>Error de autenticación</p>
            <p style={{ color: '#888', fontSize: '0.85rem' }}>{errorMsg}</p>
            <a
              href="/login"
              style={{
                display: 'inline-block',
                marginTop: '1rem',
                padding: '10px 20px',
                background: '#00e676',
                color: '#000',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              Volver al login
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem', color: '#555' }}>Cargando...</div>}>
      <VerifyContent />
    </Suspense>
  )
}
