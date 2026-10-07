import { RoleGate } from '../../src/components/auth/RoleGate'
import { AppShell } from '../../src/components/layout/AppShell'

export default function FieldLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RoleGate role="FIELD_AGENT"><AppShell role="FIELD_AGENT">{children}</AppShell></RoleGate>
}
