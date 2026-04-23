import { ObjectId } from 'mongodb'

export interface Match {
  _id: ObjectId
  team1: string
  team2: string
  status: 'open' | 'closed' | 'settled'
  result: 'team1' | 'team2' | 'draw' | null
  createdAt: Date
  closedAt: Date | null
  settledAt: Date | null
}

export interface Bet {
  _id: ObjectId
  matchId: ObjectId
  userId: ObjectId
  pick: 'team1' | 'team2' | 'draw'
  amountCents: number
  status: 'pending' | 'won' | 'lost' | 'refunded'
  payoutCents: number | null
  redsysOrderId: string
  createdAt: Date
}

export interface User {
  _id: ObjectId
  email: string
  role: 'admin' | 'user'
  balanceCents: number
  createdAt: Date
}

export interface MagicToken {
  _id: ObjectId
  userId: ObjectId
  token: string
  expiresAt: Date
  used: boolean
}

// Serializable versions (for API responses / client components)
export interface MatchJSON {
  _id: string
  team1: string
  team2: string
  status: 'open' | 'closed' | 'settled'
  result: 'team1' | 'team2' | 'draw' | null
  createdAt: string
  closedAt: string | null
  settledAt: string | null
}

export interface BetJSON {
  _id: string
  matchId: string
  userId: string
  pick: 'team1' | 'team2' | 'draw'
  amountCents: number
  status: 'pending' | 'won' | 'lost' | 'refunded'
  payoutCents: number | null
  redsysOrderId: string
  createdAt: string
}

export interface UserJSON {
  _id: string
  email: string
  role: 'admin' | 'user'
  balanceCents: number
  createdAt: string
}

export interface SessionPayload {
  userId: string
  email: string
  role: 'admin' | 'user'
}
