import crypto from 'crypto'

const MERCHANT_CODE = process.env.REDSYS_MERCHANT_CODE!
const TERMINAL = process.env.REDSYS_TERMINAL!
const SECRET_KEY = process.env.REDSYS_SECRET_KEY!
const REDSYS_URL = process.env.REDSYS_URL!
const NOTIFICATION_URL = process.env.REDSYS_NOTIFICATION_URL!
const OK_URL = process.env.REDSYS_OK_URL!
const KO_URL = process.env.REDSYS_KO_URL!

function base64url(input: Buffer | string): string {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function tripleDesEncrypt(key: Buffer, data: Buffer): Buffer {
  const cipher = crypto.createCipheriv('des-ede3-cbc', key, Buffer.alloc(8, 0))
  cipher.setAutoPadding(false)
  // Pad data to multiple of 8
  const padLen = 8 - (data.length % 8)
  const padded = Buffer.concat([data, Buffer.alloc(padLen === 8 ? 0 : padLen, 0)])
  return Buffer.concat([cipher.update(padded), cipher.final()])
}

function deriveKey(orderNumber: string): Buffer {
  const keyDecoded = Buffer.from(SECRET_KEY, 'base64')
  return tripleDesEncrypt(keyDecoded, Buffer.from(orderNumber.padEnd(8, '\0')))
}

function mac256(key: Buffer, data: string): string {
  return crypto.createHmac('sha256', key).update(Buffer.from(data)).digest('base64')
}

export interface RedsysPaymentParams {
  orderId: string
  amountCents: number
  description: string
}

export interface RedsysFormData {
  url: string
  Ds_SignatureVersion: string
  Ds_MerchantParameters: string
  Ds_Signature: string
}

export function buildRedsysForm(params: RedsysPaymentParams): RedsysFormData {
  const merchantParams = {
    DS_MERCHANT_AMOUNT: String(params.amountCents),
    DS_MERCHANT_ORDER: params.orderId,
    DS_MERCHANT_MERCHANTCODE: MERCHANT_CODE,
    DS_MERCHANT_CURRENCY: '978', // EUR
    DS_MERCHANT_TRANSACTIONTYPE: '0', // Autorización
    DS_MERCHANT_TERMINAL: TERMINAL,
    DS_MERCHANT_MERCHANTURL: NOTIFICATION_URL,
    DS_MERCHANT_URLOK: OK_URL,
    DS_MERCHANT_URLKO: KO_URL,
    DS_MERCHANT_PRODUCTDESCRIPTION: params.description.slice(0, 125),
  }

  const encoded = Buffer.from(JSON.stringify(merchantParams)).toString('base64')
  const key = deriveKey(params.orderId)
  const signature = mac256(key, encoded)

  return {
    url: REDSYS_URL,
    Ds_SignatureVersion: 'HMAC_SHA256_V1',
    Ds_MerchantParameters: encoded,
    Ds_Signature: signature,
  }
}

export function validateRedsysNotification(
  merchantParameters: string,
  signature: string,
  orderId: string
): boolean {
  try {
    const key = deriveKey(orderId)
    const expected = mac256(key, merchantParameters)
    // Normalize base64url vs base64
    const normalize = (s: string) => s.replace(/-/g, '+').replace(/_/g, '/').replace(/=/g, '')
    return normalize(expected) === normalize(signature)
  } catch {
    return false
  }
}

export function parseRedsysNotification(merchantParameters: string): Record<string, string> {
  const decoded = Buffer.from(merchantParameters, 'base64').toString('utf-8')
  return JSON.parse(decoded)
}
