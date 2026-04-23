import { NextRequest } from 'next/server'
import getDb from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { Bet, Match } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request)
    const db = await getDb()

    const [bets, matches] = await Promise.all([
      db.collection<Bet>('bets').find({}).toArray(),
      db.collection<Match>('matches').find({}).toArray(),
    ])

    const totalBets = bets.length
    const totalWageredCents = bets.reduce((s, b) => s + b.amountCents, 0)
    const totalPayoutCents = bets.reduce((s, b) => s + (b.payoutCents ?? 0), 0)
    const pendingBets = bets.filter((b) => b.status === 'pending').length
    const wonBets = bets.filter((b) => b.status === 'won').length
    const lostBets = bets.filter((b) => b.status === 'lost').length
    const refundedBets = bets.filter((b) => b.status === 'refunded').length

    const matchSummary = {
      open: matches.filter((m) => m.status === 'open').length,
      closed: matches.filter((m) => m.status === 'closed').length,
      settled: matches.filter((m) => m.status === 'settled').length,
    }

    return Response.json({
      totalBets,
      totalWageredCents,
      totalPayoutCents,
      pendingBets,
      wonBets,
      lostBets,
      refundedBets,
      matchSummary,
    })
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return Response.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 })
    }
    console.error(err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
