'use client'

import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { user, logout } = useApp()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <nav
      style={{
        background: '#1a1a24',
        borderBottom: '1px solid #2a2a3a',
        padding: '0 1.5rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span style={{ color: '#00e676', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.5px' }}>
          ⚽ GamblingApp
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {user ? (
          <>
            <Link href="/" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>
              Partidos
            </Link>
            <Link href="/my-bets" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>
              Mis Apuestas
            </Link>
            {user.role === 'admin' && (
              <Link href="/admin" style={{ color: '#00e676', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
                Admin
              </Link>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#666', fontSize: '0.85rem' }}>{user.email}</span>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid #444',
                  color: '#ccc',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Salir
              </button>
            </div>
          </>
        ) : (
          <Link
            href="/login"
            style={{
              background: '#00e676',
              color: '#000',
              padding: '8px 18px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            Acceder
          </Link>
        )}
      </div>
    </nav>
  )
}
