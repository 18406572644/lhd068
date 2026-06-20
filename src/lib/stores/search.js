import { get } from 'svelte/store'
import { createPersistentStore } from './storage.js'
import { generateId } from '../utils/helpers.js'

const MAX_SEARCH_HISTORY = 10

export const searchHistory = createPersistentStore('searchHistory', [])

export const quickFilters = createPersistentStore('quickFilters', [
  {
    id: generateId(),
    name: '临期30天内',
    filters: {
      expiryDaysMin: 0,
      expiryDaysMax: 30
    },
    createdAt: new Date().toISOString()
  },
  {
    id: generateId(),
    name: '爸爸的常备药',
    filters: {
      familyMemberIds: ['father']
    },
    createdAt: new Date().toISOString()
  },
  {
    id: generateId(),
    name: '妈妈的常备药',
    filters: {
      familyMemberIds: ['mother']
    },
    createdAt: new Date().toISOString()
  }
])

export function addSearchHistory(keyword) {
  if (!keyword || !keyword.trim()) return
  const trimmed = keyword.trim()
  searchHistory.update((list) => {
    const filtered = list.filter((item) => item !== trimmed)
    filtered.unshift(trimmed)
    return filtered.slice(0, MAX_SEARCH_HISTORY)
  })
}

export function clearSearchHistory() {
  searchHistory.set([])
}

export function removeSearchHistoryItem(item) {
  searchHistory.update((list) => list.filter((i) => i !== item))
}

export function addQuickFilter(name, filters) {
  if (!name || !name.trim()) return null
  const filter = {
    id: generateId(),
    name: name.trim(),
    filters,
    createdAt: new Date().toISOString()
  }
  quickFilters.update((list) => [filter, ...list])
  return filter
}

export function updateQuickFilter(id, data) {
  quickFilters.update((list) =>
    list.map((f) => (f.id === id ? { ...f, ...data, updatedAt: new Date().toISOString() } : f))
  )
}

export function deleteQuickFilter(id) {
  quickFilters.update((list) => list.filter((f) => f.id !== id))
}

export function getQuickFilterById(id) {
  return get(quickFilters).find((f) => f.id === id)
}
