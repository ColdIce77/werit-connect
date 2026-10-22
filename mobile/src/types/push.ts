/**
 * Nutzlast einer Push-Meldung. Sie enthält bewusst keine Inhalte, nur
 * Kategorie und Verweis. Details lädt die App nach dem Öffnen.
 */
export const PUSH_CATEGORIES = ['news', 'it_incident', 'security_alert', 'approval'] as const;

export type PushCategory = (typeof PUSH_CATEGORIES)[number];

export type PushReferenceType = 'post' | 'ticket' | 'approval' | 'safety_instruction';

export interface PushPayload {
  category: PushCategory;
  notificationId: string;
  referenceType?: PushReferenceType;
  referenceId?: string;
}
