import { NextRequest } from 'next/server'
import getDb from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { Bet, Match } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { buildRedsysForm } from '@/lib/redsys'

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request)
    const db = await getDb()

    const bets = await db
      .collection<Bet>('bets')
      .find({ userId: new ObjectId(session.userId) })
      .sort({ createdAt: -1 })
      .toArray()

    return Response.json(
      bets.map((b) => ({
        ...b,
        _id: b._id.toHexString(),
        matchId: b.matchId.toHexString(),
        userId: b.userId.toHexString(),
      }))
    )
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error(err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request)
    const { matchId, pick, amountCents } = await request.json()

    if (!matchId || !pick || !amountCents) {
      return Response.json({ error: 'matchId, pick y amountCents son requeridos' }, { status: 400 })
    }

    if (!['team1', 'team2', 'draw'].includes(pick)) {
      return Response.json({ error: 'pick inválido' }, { status: 400 })
    }

    if (typeof amountCents !== 'number' || amountCents < 100) {
      return Response.json({ error: 'amountCents debe ser al menos 100 (1€)' }, { status: 400 })
    }

    const db = await getDb()
    const match = await db.collection<Match>('matches').findOne({ _id: new ObjectId(matchId) })
    if (!match) {
      return Response.json({ error: 'Partido no encontrado' }, { status: 404 })
    }
    if (match.status !== 'open') {
      return Response.json({ error: 'El partido no está abierto para apuestas' }, { status: 400 })
    }

    // Generate unique REDSYS order ID (max 12 chars alphanumeric)
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const redsysOrderId = (timestamp + random).slice(-12).padStart(4, '0')

    const bet: Bet = {
      _id: new ObjectId(),
      matchId: new ObjectId(matchId),
      userId: new ObjectId(session.userId),
      pick,
      amountCents,
      status: 'pending',
      payoutCents: null,
      redsysOrderId,
      createdAt: new Date(),
    }

    await db.collection<Bet>('bets').insertOne(bet)

    const form = buildRedsysForm({
      orderId: redsysOrderId,
      amountCents,
      description: `${match.team1} vs ${match.team2} - ${pick}`,
    })

    return Response.json({
      bet: { ...bet, _id: bet._id.toHexString(), matchId: bet.matchId.toHexString(), userId: bet.userId.toHexString() },
      redsysForm: form,
    }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error(err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
