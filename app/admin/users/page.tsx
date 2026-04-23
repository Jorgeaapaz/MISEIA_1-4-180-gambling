'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { useRouter } from 'next/navigation'
import { UserJSON } from '@/lib/types'

function formatCents(cents: number) {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

export default function AdminUsersPage() {
  const { user, authHeader } = useApp()
  const router = useRouter()
  const [users, setUsers] = useState<UserJSON[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'admin') { router.push('/'); return }
    fetch('/api/admin/users', { headers: authHeader() })
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (!user || user.role !== 'admin') return null

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ margin: '0 0 2rem', fontSize: '2rem', fontWeight: 800, color: '#fff' }}>Gestión de usuarios</h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#555' }}>Cargando...</div>
      ) : (
        <div style={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                {['Email', 'Rol', 'Saldo', 'Registro'].map((h) => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#666', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} style={{ borderBottom: '1px solid #1a1a24' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a3a')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 20px', color: '#e0e0e0', fontSize: '0.9rem' }}>{u.email}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                      background: u.role === 'admin' ? '#00e67620' : '#1a1a2a',
                      color: u.role === 'admin' ? '#00e676' : '#888',
                    }}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: u.balanceCents > 0 ? '#00e676' : '#666', fontWeight: 600 }}>
                    {formatCents(u.balanceCents)}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#555', fontSize: '0.85rem' }}>
                    {new Date(u.createdAt).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
