import { test, expect } from '@playwright/test'

async function loginViaApi(page: import('@playwright/test').Page, email: string) {
  const res = await page.request.post('/api/auth/request', { data: { email } })
  expect(res.ok()).toBeTruthy()
  await page.waitForTimeout(500)

  const mailRes = await page.request.get('http://localhost:8025/api/v2/messages?limit=20')
  const mails = await mailRes.json()
  const mail = mails.items?.find((m: { Content: { Headers: { To: string[] } } }) =>
    m.Content.Headers.To?.some((t: string) => t.includes(email.split('@')[0]))
  )
  if (!mail) throw new Error('No email found')

  const body = mail.Content.Body as string
  const tokenMatch = body.match(/token=([^"&\s]+)/)
  if (!tokenMatch) throw new Error('No token in email')

  const token = decodeURIComponent(tokenMatch[1])
  const verifyRes = await page.request.get(`/api/auth/verify?token=${encodeURIComponent(token)}`)
  const data = await verifyRes.json()

  await page.evaluate(({ t, u }) => {
    localStorage.setItem('session_token', t)
    localStorage.setItem('session_user', JSON.stringify(u))
  }, { t: data.token, u: data.user })
}

test.describe('My Bets', () => {
  test('user can see their bets history', async ({ page }) => {
    await page.goto('/')
    await loginViaApi(page, 'alice@gambling.local')
    await page.reload()

    await page.goto('/my-bets')
    await expect(page.locator('h1')).toContainText('Mis Apuestas')
    // Alice has seeded bets
    await expect(page.locator('text=GANADA').or(page.locator('text=PERDIDA')).or(page.locator('text=PENDIENTE'))).toBeVisible({ timeout: 5000 })
  })
})
