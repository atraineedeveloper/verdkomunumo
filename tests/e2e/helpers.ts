import { expect, type Page } from '@playwright/test'
import { routes } from '../../src/lib/routes'
import { E2E_AUTH_OVERRIDE_KEY } from '../../src/lib/testing/authOverride'

const TEST_PROFILE = {
  id: 'e2e-user-1',
  email: 'e2e@example.com',
  username: 'e2e_user',
  display_name: 'E2E User',
  bio: '',
  avatar_url: '',
  esperanto_level: 'progresanto',
  theme: 'green',
  role: 'user',
  website: '',
  location: '',
  followers_count: 0,
  following_count: 0,
  posts_count: 0,
  email_notifications_enabled: true,
  email_notify_like: true,
  email_notify_comment: true,
  email_notify_follow: true,
  email_notify_message: true,
  email_notify_mention: true,
  email_notify_category_approved: true,
  email_notify_category_rejected: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
} as const

export async function enableE2EAuthOverride(page: Page) {
  await page.addInitScript(
    ({ key, profile }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          user: {
            id: profile.id,
            email: profile.email,
          },
          profile,
        }),
      )
    },
    { key: E2E_AUTH_OVERRIDE_KEY, profile: TEST_PROFILE },
  )
}

export async function gotoAndWait(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForURL(`**${path}`, { timeout: 15_000 })
  await page.waitForLoadState('load', { timeout: 15_000 }).catch(() => undefined)
  await expect(page.locator('html')).toBeVisible()
}

export async function expectPublicPageReady(page: Page, path: string) {
  if (path === routes.feed) {
    await expect(page.locator('body')).toContainText(/Verdkomunumo|beta/i, { timeout: 60_000 })
    return
  }

  if (path === routes.search) {
    await expect(page.getByRole('searchbox')).toBeVisible()
    return
  }

  if (path === routes.resetPassword) {
    await expect(page.locator('body')).toContainText(/restarig|pasvort|ligilo/i)
    return
  }

  await expect(page.getByRole('heading').first()).toBeVisible()
}

export const publicPaths = [
  routes.feed,
  routes.search,
  routes.login,
  routes.register,
  routes.forgotPassword,
]
