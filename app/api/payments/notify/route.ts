import { NextRequest } from 'next/server'
import getDb from '@/lib/db'
import { validateRedsysNotification, parseRedsysNotification } from '@/lib/redsys'
import { Bet } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)

    const merchantParameters = params.get('Ds_MerchantParameters') || ''
    const signature = params.get('Ds_Signature') || ''

    if (!merchantParameters || !signature) {
      return Response.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    const data = parseRedsysNotification(merchantParameters)
    const orderId = data.Ds_Order || data.DS_ORDER || ''
    const responseCode = parseInt(data.Ds_Response || data.DS_RESPONSE || '9999', 10)

    if (!validateRedsysNotification(merchantParameters, signature, orderId)) {
      console.error('Firma REDSYS inválida para orden:', orderId)
      return Response.json({ error: 'Firma inválida' }, { status: 400 })
    }

    const db = await getDb()
    const bet = await db.collection<Bet>('bets').findOne({ redsysOrderId: orderId })

    if (!bet) {
      console.error('Apuesta no encontrada para orden:', orderId)
      return Response.json({ error: 'Apuesta no encontrada' }, { status: 404 })
    }

    // Response code < 100 means success
    if (responseCode < 100) {
      await db.collection<Bet>('bets').updateOne(
        { _id: bet._id },
        { $set: { status: 'pending' } } // stays pending until match is settled
      )
      // Mark bet as active (confirmed payment) by changing to a special status
      // In this flow, pending = payment confirmed. Won/lost assigned at settlement.
    } else {
      // Payment failed - we keep as pending but could mark as cancelled
      // For simplicity, delete the bet on payment failure
      await db.collection<Bet>('bets').deleteOne({ _id: bet._id })
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}
