import { describe, it, expect, vi, beforeEach } from 'vitest'
import { replaceInputFiles } from './images'

describe('replaceInputFiles', () => {
  beforeEach(() => {
    // jsdom doesn't fully implement DataTransfer, so we need to mock it
    class MockDataTransfer {
      items = {
        add: vi.fn(),
        clear: vi.fn(),
      }
      _files: File[] = []

      get files() {
        return this._files;
      }

      constructor() {
        const dt = this;
        this.items.add.mockImplementation((file: File) => {
          dt._files.push(file)
        })
      }
    }
    Object.defineProperty(window, 'DataTransfer', {
      value: MockDataTransfer,
      writable: true
    })
  })

  it('should return early if input is null', () => {
    expect(() => replaceInputFiles(null, [])).not.toThrow()
  })

  it('should set input files with the given array of File objects', () => {
    // Arrange
    const input = document.createElement('input')
    input.type = 'file'

    // In JSDOM, HTMLInputElement.files requires a true FileList object which is hard to mock perfectly.
    // Let's redefine the property to allow our test to work, since in browser DataTransfer.files IS a FileList.
    Object.defineProperty(input, 'files', {
      value: null,
      writable: true
    })

    const file1 = new File(['dummy content 1'], 'test1.png', { type: 'image/png' })
    const file2 = new File(['dummy content 2'], 'test2.jpg', { type: 'image/jpeg' })
    const files = [file1, file2]

    // Act
    replaceInputFiles(input, files)

    // Assert
    expect(input.files).not.toBeNull()
    if (input.files) {
      expect(input.files.length).toBe(2)
      expect((input.files as unknown as File[])[0]).toBe(file1)
      expect((input.files as unknown as File[])[1]).toBe(file2)
    }
  })

  it('should handle an empty file array properly', () => {
    // Arrange
    const input = document.createElement('input')
    input.type = 'file'
    Object.defineProperty(input, 'files', {
      value: null,
      writable: true
    })

    const files: File[] = []

    // Act
    replaceInputFiles(input, files)

    // Assert
    expect(input.files).not.toBeNull()
    if (input.files) {
      expect(input.files.length).toBe(0)
    }
  })
})
