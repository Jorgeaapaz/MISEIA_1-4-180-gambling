import { NextRequest } from 'next/server'
import getDb from '@/lib/db'
import { requireAdmin, getSessionFromRequest } from '@/lib/auth'
import { Match } from '@/lib/types'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request)
    if (!session) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const db = await getDb()
    const status = request.nextUrl.searchParams.get('status') as Match['status'] | null
    const filter = status ? { status } : {}

    const matches = await db.collection<Match>('matches').find(filter as Record<string, unknown>).sort({ createdAt: -1 }).toArray()

    return Response.json(matches.map((m) => ({ ...m, _id: m._id.toHexString() })))
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request)

    const { team1, team2 } = await request.json()
    if (!team1 || !team2) {
      return Response.json({ error: 'team1 y team2 son requeridos' }, { status: 400 })
    }

    const db = await getDb()
    const match: Match = {
      _id: new ObjectId(),
      team1,
      team2,
      status: 'open',
      result: null,
      createdAt: new Date(),
      closedAt: null,
      settledAt: null,
    }

    await db.collection<Match>('matches').insertOne(match)

    return Response.json({ ...match, _id: match._id.toHexString() }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return Response.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 })
    }
    console.error(err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
