/**
 * Berechtigungen und Rollen. Die Schlüssel entsprechen den Zeilen in der
 * Datenbanktabelle `permissions` (siehe backend/migrations/001_initial_schema.sql).
 * Die App nutzt sie nur zum Ein- und Ausblenden. Durchgesetzt werden sie im Backend.
 */
export const PERMISSIONS = [
  'content.read',
  'assistant.use',
  'ticket.create',
  'approval.decide',
  'post.publish',
  'security_alert.publish',
  'admin.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type AppRole = 'employee' | 'team_lead' | 'manager' | 'admin';
