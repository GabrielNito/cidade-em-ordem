import { describe, expect, it } from 'vitest'
import { pathForRole } from './report'

describe('role landing paths', () => {
  it('sends each role to its authorized landing page', () => {
    expect(pathForRole('CITIZEN')).toBe('/app/mapa')
    expect(pathForRole('FIELD_AGENT')).toBe('/campo/ordens')
    expect(pathForRole('MANAGER')).toBe('/gestao/dashboard')
  })
})
