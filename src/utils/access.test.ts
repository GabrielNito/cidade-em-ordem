import { describe, expect, it } from 'vitest'
import { roleCanAccess } from './access'

describe('role authorization', () => {
  it('allows only the role required by a protected route', () => {
    expect(roleCanAccess('CITIZEN', 'CITIZEN')).toBe(true)
    expect(roleCanAccess('CITIZEN', 'FIELD_AGENT')).toBe(false)
    expect(roleCanAccess('CITIZEN', 'MANAGER')).toBe(false)
    expect(roleCanAccess('FIELD_AGENT', 'CITIZEN')).toBe(false)
    expect(roleCanAccess('MANAGER', 'FIELD_AGENT')).toBe(false)
  })
})
