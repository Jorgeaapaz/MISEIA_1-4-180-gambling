import jwt from 'jsonwebtoken'
import { SessionPayload } from './types'

const JWT_SECRET = process.env.JWT_SECRET!

export function signMagicToken(userId: string, email: string): string {
  return jwt.sign({ userId, email, type: 'magic' }, JWT_SECRET, { expiresIn: '15m' })
}

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyMagicToken(token: string): { userId: string; email: string } {
  const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & { userId: string; email: string; type: string }
  if (decoded.type !== 'magic') throw new Error('Invalid token type')
  return { userId: decoded.userId, email: decoded.email }
}

export function verifySessionToken(token: string): SessionPayload {
  return jwt.verify(token, JWT_SECRET) as SessionPayload
}

export function getSessionFromRequest(request: Request): SessionPayload | null {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    return verifySessionToken(auth.slice(7))
  } catch {
    return null
  }
}

export function requireAuth(request: Request): SessionPayload {
  const session = getSessionFromRequest(request)
  if (!session) throw new Error('Unauthorized')
  return session
}

export function requireAdmin(request: Request): SessionPayload {
  const session = requireAuth(request)
  if (session.role !== 'admin') throw new Error('Forbidden')
  return session
}
