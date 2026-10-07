import { RoleGate } from '../../src/components/auth/RoleGate'
import { AppShell } from '../../src/components/layout/AppShell'

export default function ManagementLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RoleGate role="MANAGER"><AppShell role="MANAGER">{children}</AppShell></RoleGate>
}
