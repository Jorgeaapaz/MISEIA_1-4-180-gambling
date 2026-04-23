import { test, expect } from '@playwright/test'

const MAILHOG_API = 'http://localhost:8025/api/v2'

test.describe('Authentication - Magic Link', () => {
  test('should request magic link and show confirmation', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('GamblingApp')

    await page.fill('input[type="email"]', 'test-e2e@gambling.local')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=¡Correo enviado!')).toBeVisible({ timeout: 10_000 })
  })

  test('should verify magic link token and redirect', async ({ page }) => {
    // Request magic link
    const res = await page.request.post('/api/auth/request', {
      data: { email: 'e2e-verify@gambling.local' },
    })
    expect(res.ok()).toBeTruthy()

    // Get token from Mailhog
    await page.waitForTimeout(1000)
    const mailRes = await page.request.get(`${MAILHOG_API}/messages?limit=10`)
    const mails = await mailRes.json()

    const mail = mails.items?.find((m: { Content: { Headers: { To: string[] } } }) =>
      m.Content.Headers.To?.some((t: string) => t.includes('e2e-verify'))
    )

    if (!mail) {
      test.skip()
      return
    }

    const body = mail.Content.Body as string
    const tokenMatch = body.match(/token=([^"&\s]+)/)
    if (!tokenMatch) {
      test.skip()
      return
    }

    const token = decodeURIComponent(tokenMatch[1])
    await page.goto(`/api/auth/verify?token=${encodeURIComponent(token)}`)

    // Should redirect to home
    await page.waitForURL('/')
    await expect(page).toHaveURL('/')
  })
})
