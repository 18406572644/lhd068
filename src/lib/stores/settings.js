import { createPersistentStore } from './storage.js'

const initialSettings = {
  reminderEnabled: true,
  reminderDays: 30,
  showNotifications: true,
  runInBackground: true,
  minimizeToTray: true,
  autoCheckExpiry: true,
  sortBy: 'expiry',
  groupBy: 'none',
  theme: 'light'
}

export const settings = createPersistentStore('settings', initialSettings)

export function updateSettings(data) {
  settings.update((s) => ({ ...s, ...data }))
}
