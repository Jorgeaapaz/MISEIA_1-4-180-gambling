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

test.describe('Bet Flow', () => {
  test('user can see open matches and place a bet', async ({ page }) => {
    await page.goto('/')
    await loginViaApi(page, 'bob@gambling.local')
    await page.reload()

    await expect(page.locator('h1')).toContainText('Partidos')

    // Should see open match (Real Madrid vs Barcelona from seed)
    await expect(page.locator('text=Real Madrid')).toBeVisible({ timeout: 5000 })

    // Click on the match
    await page.locator('text=Real Madrid').first().click()
    await expect(page.locator('h2:has-text("Realizar apuesta")')).toBeVisible()

    // Select pick
    await page.locator('button:has-text("Real Madrid")').click()

    // Enter amount
    await page.fill('input[type="number"]', '5')

    // Submit
    await page.click('button[type="submit"]')

    // Should show REDSYS form
    await expect(page.locator('text=Redirigiendo al TPV')).toBeVisible({ timeout: 5000 })
  })
})
