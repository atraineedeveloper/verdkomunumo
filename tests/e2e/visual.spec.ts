import { expect, test } from '@playwright/test'
import { gotoAndWait } from './helpers'

test.describe('visual regression', () => {
  test('login page matches baseline', async ({ page }) => {
    await gotoAndWait(page, '/ensaluti')
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('register page matches baseline', async ({ page }) => {
    await gotoAndWait(page, '/registrigxi')
    await expect(page).toHaveScreenshot('register-page.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })
})
