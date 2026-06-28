import { describe, it, expect } from 'vitest'
import { ObjectId } from 'mongodb'
import { calculatePayouts } from '../../../lib/payout'

function makeBet(pick: 'team1' | 'team2' | 'draw', amountCents: number) {
  return { _id: new ObjectId(), userId: new ObjectId(), pick, amountCents }
}

describe('calculatePayouts', () => {
  it('distributes pot proportionally among winners', () => {
    const alice = makeBet('team1', 1000)
    const bob = makeBet('team1', 500)
    const carol = makeBet('team2', 1500)

    const results = calculatePayouts([alice, bob, carol], 'team1')
    const aliceResult = results.find((r) => r.betId.equals(alice._id))!
    const bobResult = results.find((r) => r.betId.equals(bob._id))!
    const carolResult = results.find((r) => r.betId.equals(carol._id))!

    expect(aliceResult.status).toBe('won')
    expect(aliceResult.payoutCents).toBe(2000) // (1000/1500)*3000
    expect(bobResult.status).toBe('won')
    expect(bobResult.payoutCents).toBe(1000) // (500/1500)*3000
    expect(carolResult.status).toBe('lost')
    expect(carolResult.payoutCents).toBe(0)
  })

  it('refunds all bets when there are no winners (winnersPot === 0)', () => {
    const alice = makeBet('draw', 2000)
    const bob = makeBet('draw', 1000)

    const results = calculatePayouts([alice, bob], 'team1')

    for (const r of results) {
      expect(r.status).toBe('refunded')
    }
    expect(results.find((r) => r.betId.equals(alice._id))!.payoutCents).toBe(2000)
    expect(results.find((r) => r.betId.equals(bob._id))!.payoutCents).toBe(1000)
  })

  it('single winner receives the entire pot', () => {
    const alice = makeBet('team1', 500)
    const bob = makeBet('team2', 1500)

    const results = calculatePayouts([alice, bob], 'team1')
    const aliceResult = results.find((r) => r.betId.equals(alice._id))!

    expect(aliceResult.status).toBe('won')
    expect(aliceResult.payoutCents).toBe(2000) // entire pot (500+1500)
  })

  it('floors fractional cent values with Math.floor', () => {
    // 1/3 of 100 = 33.33... → should be 33
    const a = makeBet('team1', 1)
    const b = makeBet('team1', 1)
    const c = makeBet('team1', 1)
    const d = makeBet('team2', 97)

    const results = calculatePayouts([a, b, c, d], 'team1')
    const winners = results.filter((r) => r.status === 'won')

    for (const w of winners) {
      expect(w.payoutCents).toBe(33) // floor(1/3 * 100)
    }
    expect(winners.length).toBe(3)
  })

  it('returns empty array for empty bets', () => {
    expect(calculatePayouts([], 'team1')).toEqual([])
  })

  it('handles draw result correctly', () => {
    const a = makeBet('draw', 500)
    const b = makeBet('team1', 500)

    const results = calculatePayouts([a, b], 'draw')
    expect(results.find((r) => r.betId.equals(a._id))!.status).toBe('won')
    expect(results.find((r) => r.betId.equals(b._id))!.status).toBe('lost')
  })
})
