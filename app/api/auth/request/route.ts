import { NextRequest } from 'next/server'
import getDb from '@/lib/db'
import { signMagicToken } from '@/lib/auth'
import { sendMagicLink } from '@/lib/mail'
import { User, MagicToken } from '@/lib/types'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Email requerido' }, { status: 400 })
    }

    const db = await getDb()
    let user = await db.collection<User>('users').findOne({ email: email.toLowerCase() })

    if (!user) {
      // Auto-register as regular user
      const result = await db.collection<User>('users').insertOne({
        _id: new ObjectId(),
        email: email.toLowerCase(),
        role: 'user',
        balanceCents: 0,
        createdAt: new Date(),
      })
      user = await db.collection<User>('users').findOne({ _id: result.insertedId })
    }

    const token = signMagicToken(user!._id.toHexString(), user!.email)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await db.collection<MagicToken>('magic_tokens').insertOne({
      _id: new ObjectId(),
      userId: user!._id,
      token,
      expiresAt,
      used: false,
    })

    await sendMagicLink(user!.email, token)

    return Response.json({ message: 'Magic link enviado. Revisa tu correo.' })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
