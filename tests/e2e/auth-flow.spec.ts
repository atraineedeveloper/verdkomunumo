import { expect, test } from '@playwright/test'
import { gotoAndWait } from './helpers'

test.describe('auth and session flow', () => {
  test('guest is redirected to login with next from settings', async ({ page }) => {
    await page.goto('/agordoj', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/ensaluti\?next=%2Fagordoj/)
  })

  test('auth callback respects safe internal redirects', async ({ page }) => {
    await page.goto('/auxtentigo/revoko?next=%2Fforgesis-pasvorton', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/forgesis-pasvorton$/)
  })

  test('auth callback falls back on unsafe redirects', async ({ page }) => {
    await page.goto('/auxtentigo/revoko?next=https%3A%2F%2Fevil.example%2Fboom', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/fonto$/)
  })

  test('forgot password page remains usable', async ({ page }) => {
    await gotoAndWait(page, '/forgesis-pasvorton')
    await expect(page.getByRole('button', { name: /restarigo|reset/i })).toBeVisible()
  })
})
