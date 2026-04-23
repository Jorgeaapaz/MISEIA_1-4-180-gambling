import { Db, ObjectId } from 'mongodb'
import { Bet } from './types'

export async function settleBets(db: Db, matchId: string, result: 'team1' | 'team2' | 'draw') {
  const bets = await db
    .collection<Bet>('bets')
    .find({ matchId: new ObjectId(matchId), status: { $in: ['pending', 'won', 'lost'] } })
    .toArray()

  const activeBets = bets.filter((b) => b.status !== 'pending')
  // Only settle bets that have been confirmed by payment (not still pending)
  const confirmedBets = bets.filter((b) => b.status === 'won' || b.status === 'lost' || b.status === 'pending')

  // All non-pending bets
  const allBets = bets

  const totalPot = allBets.reduce((sum, b) => sum + b.amountCents, 0)
  const winners = allBets.filter((b) => b.pick === result)
  const winnersPot = winners.reduce((sum, b) => sum + b.amountCents, 0)

  for (const bet of allBets) {
    if (winnersPot === 0) {
      // No winners → refund everyone
      await db.collection<Bet>('bets').updateOne(
        { _id: bet._id },
        { $set: { status: 'refunded', payoutCents: bet.amountCents } }
      )
      await db.collection('users').updateOne(
        { _id: bet.userId },
        { $inc: { balanceCents: bet.amountCents } }
      )
    } else if (bet.pick === result) {
      const payoutCents = Math.floor((bet.amountCents / winnersPot) * totalPot)
      await db.collection<Bet>('bets').updateOne(
        { _id: bet._id },
        { $set: { status: 'won', payoutCents } }
      )
      await db.collection('users').updateOne(
        { _id: bet.userId },
        { $inc: { balanceCents: payoutCents } }
      )
    } else {
      await db.collection<Bet>('bets').updateOne(
        { _id: bet._id },
        { $set: { status: 'lost', payoutCents: 0 } }
      )
    }
  }
}
