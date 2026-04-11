import { expect, test } from '@playwright/test'
import { expectPublicPageReady, gotoAndWait } from './helpers'

test.describe('visual regression', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    // Fast fail API requests to prevent flaky visual snapshots caused by React Query retrying failed Supabase endpoints
    await page.route('**/rest/v1/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })
  })

  test('feed guest page matches baseline', async ({ page }) => {
    await gotoAndWait(page, '/fonto')
    await expectPublicPageReady(page, '/fonto')
    await expect(page).toHaveScreenshot('feed-guest-page.png', {
      fullPage: true,
      animations: 'disabled',
      timeout: 15_000,
    })
  })

  test('login page matches baseline', async ({ page }) => {
    await gotoAndWait(page, '/ensaluti')
    await expectPublicPageReady(page, '/ensaluti')
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: 'disabled',
      timeout: 15_000,
    })
  })

  test('register page matches baseline', async ({ page }) => {
    await gotoAndWait(page, '/registrigxi')
    await expectPublicPageReady(page, '/registrigxi')
    await expect(page).toHaveScreenshot('register-page.png', {
      fullPage: true,
      animations: 'disabled',
      timeout: 15_000,
    })
  })

  test('forgot password page matches baseline', async ({ page }) => {
    await gotoAndWait(page, '/forgesis-pasvorton')
    await expectPublicPageReady(page, '/forgesis-pasvorton')
    await expect(page).toHaveScreenshot('forgot-password-page.png', {
      fullPage: true,
      animations: 'disabled',
      timeout: 15_000,
    })
  })

  test('reset password page matches baseline', async ({ page }) => {
    await gotoAndWait(page, '/restarigi-pasvorton')
    await expectPublicPageReady(page, '/restarigi-pasvorton')
    await expect(page).toHaveScreenshot('reset-password-page.png', {
      fullPage: true,
      animations: 'disabled',
      timeout: 15_000,
    })
  })
})
