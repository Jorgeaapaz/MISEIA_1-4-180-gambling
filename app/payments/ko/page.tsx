'use client'

import Link from 'next/link'

export default function PaymentKoPage() {
  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', maxWidth: 420, width: '100%' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 800, color: '#ff4444' }}>Pago fallido</h1>
        <p style={{ color: '#888', marginBottom: '2rem' }}>El pago no se ha podido procesar. Tu apuesta no ha sido registrada.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ padding: '10px 20px', background: '#00e676', color: '#000', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
            Intentar de nuevo
          </Link>
          <Link href="/my-bets" style={{ padding: '10px 20px', background: '#1a1a24', border: '1px solid #2a2a3a', color: '#ccc', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
            Mis apuestas
          </Link>
        </div>
      </div>
    </div>
  )
}
