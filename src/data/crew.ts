import type { CrewMember } from '../types/domain'

export const CREW_MEMBERS: CrewMember[] = [
  { id: 'crew-ana', name: 'Ana Paula Souza', specialty: 'Manutenção urbana', initials: 'AS' },
  { id: 'crew-bruno', name: 'Bruno Martins', specialty: 'Vias e sinalização', initials: 'BM' },
  { id: 'crew-camila', name: 'Camila Ferreira', specialty: 'Iluminação pública', initials: 'CF' },
  { id: 'crew-diego', name: 'Diego Oliveira', specialty: 'Parques e poda', initials: 'DO' },
]

export function getCrewMember(id?: string) {
  return CREW_MEMBERS.find((member) => member.id === id)
}
