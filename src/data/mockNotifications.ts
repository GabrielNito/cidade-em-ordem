import type { AppNotification } from '../types/domain'

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'STATUS_UPDATE',
    title: 'Ordem de serviço iniciada',
    message: 'Sua ocorrência de Buraco na via (P-2026-0001) na Av. Eng. Fábio Roberto Barnabé entrou em atendimento pela equipe de pavimentação.',
    protocol: 'P-2026-0001',
    reportId: 'report-001',
    read: false,
    createdAt: '2026-10-07T14:30:00.000Z',
  },
  {
    id: 'notif-2',
    type: 'COMMUNITY_SUPPORT',
    title: '3 vizinhos apoiaram seu chamado',
    message: 'Moradores do Jardim Morada do Sol confirmaram a necessidade de reparo no ponto indicado por você.',
    protocol: 'P-2026-0002',
    reportId: 'report-002',
    read: false,
    createdAt: '2026-10-06T18:15:00.000Z',
  },
  {
    id: 'notif-3',
    type: 'SERVICE_COMPLETED',
    title: 'Manutenção concluída com sucesso',
    message: 'A equipe concluiu o serviço de Poda preventiva no Parque Ecológico. O registro fotográfico da conclusão já está disponível.',
    protocol: 'P-2026-0005',
    reportId: 'report-005',
    read: true,
    createdAt: '2026-10-05T10:00:00.000Z',
  },
  {
    id: 'notif-4',
    type: 'OFFICIAL_ALERT',
    title: 'Zeladoria Urbana em seu bairro',
    message: 'A Secretaria de Serviços Urbanos de Indaiatuba programou mutirão de iluminação e sinalização na região central esta semana.',
    read: true,
    createdAt: '2026-10-04T08:00:00.000Z',
  },
]
