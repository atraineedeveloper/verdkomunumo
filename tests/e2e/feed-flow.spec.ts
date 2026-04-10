import { expect, test } from '@playwright/test'
import { enableE2EAuthOverride, expectPublicPageReady, gotoAndWait } from './helpers'

test.describe('feed guest flow', () => {
  test.describe.configure({ mode: 'serial' })

  test('guest feed shows CTA and supports auth navigation', async ({ page }) => {
    await gotoAndWait(page, '/fonto')
    await expectPublicPageReady(page, '/fonto')

    await expect(page.getByRole('link', { name: /ensaluti|login/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /registri|register|crear cuenta/i }).first()).toBeVisible()
  })

  test('feed filters update the URL', async ({ page }) => {
    await gotoAndWait(page, '/fonto')
    await expectPublicPageReady(page, '/fonto')

    await page.locator('main nav a[href="/fonto?filter=following"]').click()
    await expect(page).toHaveURL(/\/fonto\?filter=following/)

    await page.locator('main nav a[href="/fonto"]').first().click()
    await expect(page).toHaveURL(/\/fonto$/)
  })

  test('beta banner can be dismissed and stays dismissed after reload', async ({ page }) => {
    await gotoAndWait(page, '/fonto')
    await expectPublicPageReady(page, '/fonto')

    const dismissButton = page.getByRole('button', { name: /beta/i })
    await expect(dismissButton).toBeVisible()
    await dismissButton.click()
    await expect(dismissButton).toHaveCount(0)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expectPublicPageReady(page, '/fonto')
    await expect(page.getByRole('button', { name: /beta/i })).toHaveCount(0)
  })

  test('authenticated feed shows composer instead of guest CTA', async ({ page }) => {
    await enableE2EAuthOverride(page)
    await gotoAndWait(page, '/fonto')
    await expectPublicPageReady(page, '/fonto')

    await expect(page.locator('textarea.composer-textarea')).toBeVisible()
    await expect(page.locator('.guest-cta')).toHaveCount(0)
  })

  test('authenticated user can quote a post and clear the quoted state', async ({ page }) => {
    await enableE2EAuthOverride(page)
    await gotoAndWait(page, '/fonto')
    await expectPublicPageReady(page, '/fonto')

    await page.getByRole('button', { name: /citi/i }).first().click()
    await expect(page.locator('.quote-wrap')).toBeVisible()
    await expect(page.locator('.quote-label')).toContainText(/citante/i)

    await page.getByRole('button', { name: /forigu|cita/i }).click()
    await expect(page.locator('.quote-wrap')).toHaveCount(0)
  })
})
