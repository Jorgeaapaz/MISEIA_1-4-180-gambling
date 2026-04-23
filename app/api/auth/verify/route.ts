import { NextRequest } from 'next/server'
import getDb from '@/lib/db'
import { verifyMagicToken, signSessionToken } from '@/lib/auth'
import { User, MagicToken } from '@/lib/types'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return Response.json({ error: 'Token requerido' }, { status: 400 })
    }

    let payload: { userId: string; email: string }
    try {
      payload = verifyMagicToken(token)
    } catch {
      return Response.json({ error: 'Token inválido o expirado' }, { status: 401 })
    }

    const db = await getDb()
    const magicToken = await db.collection<MagicToken>('magic_tokens').findOne({ token, used: false })

    if (!magicToken) {
      return Response.json({ error: 'Token ya utilizado o no encontrado' }, { status: 401 })
    }

    // Mark token as used
    await db.collection<MagicToken>('magic_tokens').updateOne({ _id: magicToken._id }, { $set: { used: true } })

    const user = await db.collection<User>('users').findOne({ _id: new ObjectId(payload.userId) })
    if (!user) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const sessionToken = signSessionToken({
      userId: user._id.toHexString(),
      email: user.email,
      role: user.role,
    })

    return Response.json({ token: sessionToken, user: { id: user._id.toHexString(), email: user.email, role: user.role } })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
