export type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export interface StatusMeta {
  label: string;
  variant: BadgeVariant;
}

function build(map: Record<string, StatusMeta>) {
  return (status: string): StatusMeta => map[status] ?? { label: status, variant: 'neutral' };
}

export const clientStatusMeta = build({
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'neutral' }
});

export const userStatusMeta = clientStatusMeta;

export const userRoleMeta = build({
  admin: { label: 'Administrador', variant: 'info' },
  user: { label: 'Agente', variant: 'success' },
  guest: { label: 'Invitado', variant: 'neutral' }
});

export const policyStatusMeta = build({
  draft: { label: 'Borrador', variant: 'neutral' },
  active: { label: 'Activa', variant: 'success' },
  expired: { label: 'Vencida', variant: 'warning' },
  cancelled: { label: 'Cancelada', variant: 'danger' }
});

export const paymentStatusMeta = build({
  pending: { label: 'Pendiente', variant: 'warning' },
  paid: { label: 'Pagado', variant: 'success' },
  reversed: { label: 'Revertido', variant: 'danger' }
});

export const incidentStatusMeta = build({
  reported: { label: 'Reportado', variant: 'warning' },
  under_review: { label: 'En revisión', variant: 'info' },
  closed: { label: 'Cerrado', variant: 'success' }
});

export const claimStatusMeta = build({
  received: { label: 'Recibida', variant: 'neutral' },
  under_analysis: { label: 'En análisis', variant: 'info' },
  approved: { label: 'Aprobada', variant: 'success' },
  rejected: { label: 'Rechazada', variant: 'danger' }
});

export const notificationTypeMeta = build({
  policy: { label: 'Póliza', variant: 'info' },
  payment: { label: 'Pago', variant: 'success' },
  incident: { label: 'Siniestro', variant: 'warning' },
  claim: { label: 'Reclamación', variant: 'danger' },
  system: { label: 'Sistema', variant: 'neutral' }
});

export const insuranceTypeMeta = build({
  auto: { label: 'Automóvil', variant: 'neutral' },
  home: { label: 'Hogar', variant: 'neutral' },
  life: { label: 'Vida', variant: 'neutral' },
  health: { label: 'Salud', variant: 'neutral' },
  travel: { label: 'Viaje', variant: 'neutral' },
  other: { label: 'Otro', variant: 'neutral' }
});

export const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  other: 'Otro'
};
