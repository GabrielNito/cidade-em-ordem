import { RoleGate } from '../../src/components/auth/RoleGate'
import { AppShell } from '../../src/components/layout/AppShell'

export default function CitizenLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RoleGate role="CITIZEN"><AppShell role="CITIZEN">{children}</AppShell></RoleGate>
}
