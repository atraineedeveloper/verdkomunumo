import { expect, test } from '@playwright/test'
import { expectPublicPageReady, gotoAndWait, publicPaths } from './helpers'

test.describe('public smoke', () => {
  for (const path of publicPaths) {
    test(`loads ${path}`, async ({ page }) => {
      await gotoAndWait(page, path)
      await expectPublicPageReady(page, path)
      await expect(page.locator('body')).not.toContainText('Application error')
    })
  }

  test('can move from feed to login from guest cta', async ({ page }) => {
    await gotoAndWait(page, '/fonto')
    await page.getByRole('link', { name: /ensaluti|iniciar sesión|login/i }).first().click()
    await expect(page).toHaveURL(/\/ensaluti/)
  })
})
