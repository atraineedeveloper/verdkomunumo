import { describe, expect, it } from 'vitest'
import { hasCommentEditChanges, hasPostEditChanges, mergeUniqueFiles } from '@/lib/editor'

function makeFile(name: string, size: number, lastModified: number) {
  return new File(['x'.repeat(size)], name, { type: 'image/png', lastModified })
}

describe('editor helpers', () => {
  it('merges files without duplicates and respects the max limit', () => {
    const first = makeFile('uno.png', 10, 1)
    const duplicate = makeFile('uno.png', 10, 1)
    const second = makeFile('dos.png', 20, 2)
    const third = makeFile('tri.png', 30, 3)

    expect(mergeUniqueFiles([first], [duplicate, second, third], 2)).toEqual([first, second])
  })

  it('detects meaningful post edit changes', () => {
    expect(
      hasPostEditChanges({
        initialContent: ' Saluton ',
        initialCategoryId: 'a',
        nextContent: 'Saluton',
        nextCategoryId: 'a',
      })
    ).toBe(false)

    expect(
      hasPostEditChanges({
        initialContent: 'Saluton',
        initialCategoryId: 'a',
        nextContent: 'Nova teksto',
        nextCategoryId: 'a',
      })
    ).toBe(true)
  })

  it('detects meaningful comment edit changes', () => {
    expect(hasCommentEditChanges(' Saluton ', 'Saluton')).toBe(false)
    expect(hasCommentEditChanges('Saluton', 'Saluton mondo')).toBe(true)
  })
})
