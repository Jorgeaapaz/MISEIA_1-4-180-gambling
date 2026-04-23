import { NextRequest } from 'next/server'
import getDb from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { User } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request)
    const db = await getDb()
    const users = await db.collection<User>('users').find({}).sort({ createdAt: -1 }).toArray()

    return Response.json(
      users.map((u) => ({
        ...u,
        _id: u._id.toHexString(),
      }))
    )
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return Response.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 })
    }
    console.error(err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
