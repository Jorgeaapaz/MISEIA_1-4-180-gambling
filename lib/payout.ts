import { Db, ObjectId } from 'mongodb'
import { Bet } from './types'

export type PayoutResult = {
  betId: ObjectId
  userId: ObjectId
  status: 'won' | 'lost' | 'refunded'
  payoutCents: number
}

export function calculatePayouts(
  bets: Pick<Bet, '_id' | 'userId' | 'pick' | 'amountCents'>[],
  result: 'team1' | 'team2' | 'draw'
): PayoutResult[] {
  const totalPot = bets.reduce((sum, b) => sum + b.amountCents, 0)
  const winnersPot = bets
    .filter((b) => b.pick === result)
    .reduce((sum, b) => sum + b.amountCents, 0)

  return bets.map((b) => {
    if (winnersPot === 0) {
      return { betId: b._id, userId: b.userId, status: 'refunded', payoutCents: b.amountCents }
    }
    if (b.pick === result) {
      return {
        betId: b._id,
        userId: b.userId,
        status: 'won',
        payoutCents: Math.floor((b.amountCents / winnersPot) * totalPot),
      }
    }
    return { betId: b._id, userId: b.userId, status: 'lost', payoutCents: 0 }
  })
}

export async function settleBets(db: Db, matchId: string, result: 'team1' | 'team2' | 'draw') {
  const bets = await db
    .collection<Bet>('bets')
    .find({ matchId: new ObjectId(matchId), status: { $in: ['pending', 'won', 'lost'] } })
    .toArray()

  const allBets = bets

  const results = calculatePayouts(allBets, result)

  for (const r of results) {
    await db.collection<Bet>('bets').updateOne(
      { _id: r.betId },
      { $set: { status: r.status, payoutCents: r.payoutCents } }
    )
    if (r.payoutCents > 0) {
      await db.collection('users').updateOne(
        { _id: r.userId },
        { $inc: { balanceCents: r.payoutCents } }
      )
    }
  }
}
