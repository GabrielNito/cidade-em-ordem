import { afterEach } from 'vitest'

function createMemoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => { values.delete(key) },
    setItem: (key, value) => { values.set(key, String(value)) },
  }
}

let storage: Storage = createMemoryStorage()
try {
  if (typeof window !== 'undefined' && window.localStorage) storage = window.localStorage
} catch {
  // Node may expose localStorage as an unavailable experimental global.
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: storage,
  writable: true,
})

afterEach(() => {
  localStorage.clear()
})
