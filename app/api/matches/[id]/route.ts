import { NextRequest } from 'next/server'
import getDb from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { Match } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { settleBets } from '@/lib/payout'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request)

    const { id } = await params
    const body = await request.json()
    const db = await getDb()

    const match = await db.collection<Match>('matches').findOne({ _id: new ObjectId(id) })
    if (!match) {
      return Response.json({ error: 'Partido no encontrado' }, { status: 404 })
    }

    const update: Partial<Match> = {}

    if (body.status) {
      if (body.status === 'closed' && match.status === 'open') {
        update.status = 'closed'
        update.closedAt = new Date()
      } else if (body.status === 'settled' && match.status === 'closed') {
        if (!body.result || !['team1', 'team2', 'draw'].includes(body.result)) {
          return Response.json({ error: 'Resultado inválido' }, { status: 400 })
        }
        update.status = 'settled'
        update.result = body.result
        update.settledAt = new Date()
      } else {
        return Response.json({ error: 'Transición de estado inválida' }, { status: 400 })
      }
    }

    await db.collection<Match>('matches').updateOne({ _id: new ObjectId(id) }, { $set: update })

    if (update.status === 'settled' && update.result) {
      await settleBets(db, id, update.result)
    }

    const updated = await db.collection<Match>('matches').findOne({ _id: new ObjectId(id) })
    return Response.json({ ...updated, _id: updated!._id.toHexString() })
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return Response.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 })
    }
    console.error(err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
