import { describe, it, expect } from 'vitest'
import { buildRedsysForm, validateRedsysNotification, parseRedsysNotification } from '../../../lib/redsys'

describe('buildRedsysForm', () => {
  it('returns form data with required REDSYS fields', () => {
    const form = buildRedsysForm({
      orderId: '0000000001',
      amountCents: 1000,
      description: 'Bet on Real Madrid',
    })

    expect(form.url).toBe('https://sis-t.redsys.es:25443/sis/realizarPago')
    expect(form.Ds_SignatureVersion).toBe('HMAC_SHA256_V1')
    expect(typeof form.Ds_MerchantParameters).toBe('string')
    expect(typeof form.Ds_Signature).toBe('string')
  })

  it('encodes merchant parameters as base64 JSON', () => {
    const form = buildRedsysForm({
      orderId: '0000000002',
      amountCents: 500,
      description: 'Test bet',
    })

    const decoded = JSON.parse(Buffer.from(form.Ds_MerchantParameters, 'base64').toString('utf-8'))
    expect(decoded.DS_MERCHANT_AMOUNT).toBe('500')
    expect(decoded.DS_MERCHANT_ORDER).toBe('0000000002')
    expect(decoded.DS_MERCHANT_MERCHANTCODE).toBe('999008881')
    expect(decoded.DS_MERCHANT_CURRENCY).toBe('978') // EUR
  })

  it('truncates product description to 125 chars', () => {
    const longDesc = 'A'.repeat(200)
    const form = buildRedsysForm({ orderId: '0000000003', amountCents: 100, description: longDesc })
    const decoded = JSON.parse(Buffer.from(form.Ds_MerchantParameters, 'base64').toString('utf-8'))
    expect(decoded.DS_MERCHANT_PRODUCTDESCRIPTION.length).toBe(125)
  })
})

describe('validateRedsysNotification', () => {
  it('returns true for a correctly signed notification', () => {
    const form = buildRedsysForm({
      orderId: '0000000010',
      amountCents: 1000,
      description: 'Test',
    })

    const isValid = validateRedsysNotification(
      form.Ds_MerchantParameters,
      form.Ds_Signature,
      '0000000010'
    )
    expect(isValid).toBe(true)
  })

  it('returns false for a tampered signature', () => {
    const form = buildRedsysForm({
      orderId: '0000000011',
      amountCents: 1000,
      description: 'Test',
    })

    const isValid = validateRedsysNotification(
      form.Ds_MerchantParameters,
      'tampered_signature_value',
      '0000000011'
    )
    expect(isValid).toBe(false)
  })

  it('returns false for tampered merchant parameters', () => {
    const form = buildRedsysForm({
      orderId: '0000000012',
      amountCents: 1000,
      description: 'Test',
    })

    const isValid = validateRedsysNotification(
      form.Ds_MerchantParameters + 'X',
      form.Ds_Signature,
      '0000000012'
    )
    expect(isValid).toBe(false)
  })
})

describe('parseRedsysNotification', () => {
  it('decodes base64 merchant parameters to JSON object', () => {
    const form = buildRedsysForm({
      orderId: '0000000020',
      amountCents: 750,
      description: 'Parse test',
    })
    const parsed = parseRedsysNotification(form.Ds_MerchantParameters)
    expect(parsed.DS_MERCHANT_ORDER).toBe('0000000020')
    expect(parsed.DS_MERCHANT_AMOUNT).toBe('750')
  })
})
