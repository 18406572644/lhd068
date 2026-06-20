import { writable, get } from 'svelte/store'

function createPersistentStore(key, initialValue) {
  const stored = localStorage.getItem(key)
  const value = stored ? JSON.parse(stored) : initialValue
  const store = writable(value)

  store.subscribe((val) => {
    localStorage.setItem(key, JSON.stringify(val))
  })

  return store
}

export { createPersistentStore }
