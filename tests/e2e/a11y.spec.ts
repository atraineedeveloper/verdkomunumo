import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { expectPublicPageReady, gotoAndWait } from './helpers'

test.describe('accessibility', () => {
  test.describe.configure({ mode: 'serial' })

  for (const path of ['/fonto', '/ensaluti', '/registrigxi', '/forgesis-pasvorton', '/restarigi-pasvorton']) {
    test(`has no critical axe violations on ${path}`, async ({ page }, testInfo) => {
      await gotoAndWait(page, path)
      await expectPublicPageReady(page, path)

      // Wait for any potential re-renders to settle before analyzing
      await page.waitForTimeout(1000)

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      const criticalViolations = results.violations.filter((violation) => violation.impact === 'critical')
      const seriousViolations = results.violations.filter((violation) => violation.impact === 'serious')

      if (seriousViolations.length > 0) {
        await testInfo.attach(`axe-serious-${path.replaceAll('/', '_')}`, {
          body: Buffer.from(
            JSON.stringify(
              seriousViolations.map((violation) => ({
                id: violation.id,
                impact: violation.impact,
                help: violation.help,
                nodes: violation.nodes.length,
              })),
              null,
              2
            )
          ),
          contentType: 'application/json',
        })
      }

      expect(criticalViolations).toEqual([])
    })
  }
})
