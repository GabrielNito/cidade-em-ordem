import type { UserRole } from '../types/domain'

export function roleCanAccess(currentRole: UserRole, requiredRole: UserRole) {
  return currentRole === requiredRole
}

