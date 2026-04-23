import { test, expect } from '@playwright/test'

async function loginAs(page: import('@playwright/test').Page, email: string) {
  const res = await page.request.post('/api/auth/request', { data: { email } })
  expect(res.ok()).toBeTruthy()
  await page.waitForTimeout(500)

  // Fetch token from Mailhog
  const mailRes = await page.request.get('http://localhost:8025/api/v2/messages?limit=20')
  const mails = await mailRes.json()
  const mail = mails.items?.find((m: { Content: { Headers: { To: string[] } } }) =>
    m.Content.Headers.To?.some((t: string) => t.includes(email.split('@')[0]))
  )
  if (!mail) throw new Error('No magic link email found')

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

test.describe('Admin Match Management', () => {
  test('admin can create a match', async ({ page }) => {
    await page.goto('/')
    await loginAs(page, 'admin@gambling.local')
    await page.reload()

    await page.goto('/admin/matches/new')
    await page.fill('input[placeholder="Ej: Real Madrid"]', 'Equipo A')
    await page.fill('input[placeholder="Ej: Barcelona"]', 'Equipo B')
    await page.click('button[type="submit"]')

    await page.waitForURL('/admin/matches')
    await expect(page.locator('text=Equipo A')).toBeVisible({ timeout: 5000 })
  })

  test('admin can close a match', async ({ page }) => {
    await page.goto('/')
    await loginAs(page, 'admin@gambling.local')
    await page.reload()

    await page.goto('/admin/matches')
    const closeBtn = page.locator('button:has-text("Cerrar")').first()
    if (await closeBtn.isVisible()) {
      await closeBtn.click()
      await page.waitForTimeout(500)
      await page.reload()
      await expect(page.locator('text=CERRADO')).toBeVisible()
    }
  })
})
