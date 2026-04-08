import { expect, type Page } from '@playwright/test'
import { routes } from '../../src/lib/routes'

export async function gotoAndWait(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForURL(`**${path}`)
  await expect(page.locator('body')).toBeVisible()
  await expect(page.getByLabel('Loading route')).toHaveCount(0)
}

export async function expectPublicPageReady(page: Page, path: string) {
  if (path === routes.feed) {
    await expect(page.locator('body')).toContainText(/Verdkomunumo|beta/i)
    return
  }

  if (path === routes.search) {
    await expect(page.getByRole('searchbox')).toBeVisible()
    return
  }

  await expect(page.locator('form')).toBeVisible()
}

export const publicPaths = [
  routes.feed,
  routes.search,
  routes.login,
  routes.register,
  routes.forgotPassword,
]
