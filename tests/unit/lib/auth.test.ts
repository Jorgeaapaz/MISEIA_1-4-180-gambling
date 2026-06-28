import { describe, it, expect } from 'vitest'
import {
  signMagicToken,
  signSessionToken,
  verifyMagicToken,
  verifySessionToken,
} from '../../../lib/auth'

describe('signMagicToken / verifyMagicToken', () => {
  it('signs a magic token with correct payload', () => {
    const token = signMagicToken('user123', 'alice@example.com')
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3) // valid JWT structure
  })

  it('verifies a valid magic token and returns payload', () => {
    const token = signMagicToken('user123', 'alice@example.com')
    const decoded = verifyMagicToken(token)
    expect(decoded.userId).toBe('user123')
    expect(decoded.email).toBe('alice@example.com')
  })

  it('throws for a token with wrong type', () => {
    // signSessionToken doesn't set type=magic
    const sessionToken = signSessionToken({ userId: 'u1', email: 'a@b.com', role: 'user' })
    expect(() => verifyMagicToken(sessionToken)).toThrow('Invalid token type')
  })

  it('throws for a tampered token', () => {
    const token = signMagicToken('user123', 'alice@example.com')
    const tampered = token.slice(0, -5) + 'xxxxx'
    expect(() => verifyMagicToken(tampered)).toThrow()
  })
})

describe('signSessionToken / verifySessionToken', () => {
  it('signs a session token with correct payload', () => {
    const payload = { userId: 'abc', email: 'bob@example.com', role: 'admin' as const }
    const token = signSessionToken(payload)
    expect(typeof token).toBe('string')
  })

  it('verifies and returns the session payload', () => {
    const payload = { userId: 'abc', email: 'bob@example.com', role: 'user' as const }
    const token = signSessionToken(payload)
    const decoded = verifySessionToken(token)
    expect(decoded.userId).toBe('abc')
    expect(decoded.email).toBe('bob@example.com')
    expect(decoded.role).toBe('user')
  })

  it('throws for a tampered session token', () => {
    const token = signSessionToken({ userId: 'u1', email: 'x@y.com', role: 'user' })
    const tampered = token.replace(token[10], 'Z')
    expect(() => verifySessionToken(tampered)).toThrow()
  })
})
