import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  shouldNotify,
  isTabVisible,
  requestPermission,
  showBrowserNotification,
} from './browserNotifications'
import type { NotificationType } from '@/lib/types'

describe('browserNotifications', () => {
  describe('shouldNotify', () => {
    it('returns true for supported notification types', () => {
      expect(shouldNotify('comment')).toBe(true)
      expect(shouldNotify('follow')).toBe(true)
      expect(shouldNotify('mention')).toBe(true)
      expect(shouldNotify('message')).toBe(true)
    })

    it('returns false for unsupported notification types', () => {
      expect(shouldNotify('like')).toBe(false)
      expect(shouldNotify('category_approved')).toBe(false)
      expect(shouldNotify('category_rejected')).toBe(false)
    })
  })

  describe('isTabVisible', () => {
    let originalVisibilityState: DocumentVisibilityState

    beforeEach(() => {
      originalVisibilityState = document.visibilityState
    })

    afterEach(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: originalVisibilityState,
        writable: true,
      })
    })

    it('returns true when document is visible', () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      })
      expect(isTabVisible()).toBe(true)
    })

    it('returns false when document is hidden', () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
      })
      expect(isTabVisible()).toBe(false)
    })
  })

  describe('requestPermission', () => {
    let originalNotification: any

    beforeEach(() => {
      originalNotification = window.Notification
    })

    afterEach(() => {
      // @ts-ignore
      window.Notification = originalNotification
      vi.restoreAllMocks()
    })

    it('returns false when Notification is not supported', async () => {
      // @ts-ignore
      delete window.Notification
      const result = await requestPermission()
      expect(result).toBe(false)
    })

    it('returns true immediately if permission is already granted', async () => {
      // @ts-ignore
      window.Notification = { permission: 'granted' }
      const result = await requestPermission()
      expect(result).toBe(true)
    })

    it('returns false immediately if permission is already denied', async () => {
      // @ts-ignore
      window.Notification = { permission: 'denied' }
      const result = await requestPermission()
      expect(result).toBe(false)
    })

    it('returns true when user grants permission', async () => {
      // @ts-ignore
      window.Notification = {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      }
      const result = await requestPermission()
      expect(window.Notification.requestPermission).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('returns false when user denies permission', async () => {
      // @ts-ignore
      window.Notification = {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('denied'),
      }
      const result = await requestPermission()
      expect(window.Notification.requestPermission).toHaveBeenCalled()
      expect(result).toBe(false)
    })
  })

  describe('showBrowserNotification', () => {
    let originalNotification: any
    let mockNotificationInstance: any
    let mockNotificationConstructor: any

    beforeEach(() => {
      originalNotification = window.Notification
      mockNotificationInstance = {
        close: vi.fn(),
      }
      mockNotificationConstructor = vi.fn().mockImplementation(function() {
        return mockNotificationInstance
      })

      // Setup default valid notification environment
      // @ts-ignore
      window.Notification = mockNotificationConstructor
      // @ts-ignore
      window.Notification.permission = 'granted'

      vi.spyOn(Date, 'now').mockReturnValue(1234567890)
    })

    afterEach(() => {
      // @ts-ignore
      window.Notification = originalNotification
      vi.restoreAllMocks()
    })

    it('does nothing if Notification is not supported', () => {
      // @ts-ignore
      delete window.Notification
      showBrowserNotification('Test Title', 'Test Body')
      // No errors should be thrown
    })

    it('does nothing if permission is not granted', () => {
      // @ts-ignore
      window.Notification.permission = 'denied'
      showBrowserNotification('Test Title', 'Test Body')
      expect(mockNotificationConstructor).not.toHaveBeenCalled()
    })

    it('creates a new Notification with correct arguments', () => {
      showBrowserNotification('Test Title', 'Test Body')

      expect(mockNotificationConstructor).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/favicon.ico',
        tag: 'verdkomunumo-1234567890',
      })
    })

    it('attaches an onclick handler that focuses the window, closes the notification, and calls the callback', () => {
      const mockFocus = vi.fn()
      window.focus = mockFocus
      const mockOnClick = vi.fn()

      showBrowserNotification('Test Title', 'Test Body', mockOnClick)

      expect(mockNotificationInstance.onclick).toBeDefined()

      // Trigger the onclick
      mockNotificationInstance.onclick()

      expect(mockFocus).toHaveBeenCalled()
      expect(mockNotificationInstance.close).toHaveBeenCalled()
      expect(mockOnClick).toHaveBeenCalled()
    })
  })
})
