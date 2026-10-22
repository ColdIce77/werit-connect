import type { AppRole, Permission } from '../permissions';

/**
 * Vertrag zwischen App und API (Phase 5 setzt ihn im Backend um).
 * Texte liefert das Backend bereits in der Sprache aus dem Header Accept-Language.
 * Zeitangaben sind ISO-8601-Zeichenketten in UTC.
 */

export interface MeResponse {
  user: {
    id: string;
    displayName: string;
    email: string;
    language: string;
  };
  roles: AppRole[];
  permissions: Permission[];
}

export type PostType = 'news' | 'announcement';
export type PostPriority = 'normal' | 'important';

export interface Post {
  id: string;
  type: PostType;
  priority: PostPriority;
  title: string;
  summary: string | null;
  body: string;
  imageUrl: string | null;
  authorName: string | null;
  publishAt: string;
}

export type TaskStatus = 'open' | 'done' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  status: TaskStatus;
}

export interface BirthdayEntry {
  userId: string;
  displayName: string;
  day: number;
  month: number;
  isToday: boolean;
}

export interface NewHire {
  userId: string;
  displayName: string;
  jobTitle: string | null;
  departmentName: string | null;
  hireDate: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TicketSummary {
  id: string;
  title: string;
  status: TicketStatus;
  updatedAt: string;
}

export interface DashboardResponse {
  announcements: Post[];
  news: Post[];
  tasks: Task[];
  birthdays: BirthdayEntry[];
  newHires: NewHire[];
  openTickets: { count: number; items: TicketSummary[] };
}

export interface EmergencyContact {
  id: string;
  category: string;
  label: string;
  description: string | null;
  phone: string;
  sortOrder: number;
  locationName: string | null;
}

export interface SafetyInstruction {
  id: string;
  code: string;
  version: number;
  title: string;
  summary: string | null;
  body: string;
  isMandatory: boolean;
  validUntil: string | null;
  /** Verweis auf ein Dokument (Anhang), das über die Dokumentenansicht geöffnet wird */
  documentId: string | null;
  /** Zuletzt bestätigte Version des angemeldeten Nutzers, null = noch nie bestätigt */
  acknowledgedVersion: number | null;
}

export interface DocumentMeta {
  id: string;
  title: string;
  mimeType: string | null;
  sizeBytes: number | null;
  version: string | null;
  category: string | null;
  webUrl: string;
  updatedAt: string;
}

/** Antwort der Delta-Synchronisation (offlinefähige Inhalte) */
export interface SyncPage<T> {
  items: T[];
  deletedIds: string[];
  serverTime: string;
  hasMore: boolean;
  cursor: string | null;
}

export type NotificationCategory = 'news' | 'it_incident' | 'security_alert' | 'approval';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  isUrgent: boolean;
  title: string;
  body: string;
  referenceType: 'post' | 'ticket' | 'approval' | 'safety_instruction' | null;
  referenceId: string | null;
  createdAt: string;
  readAt: string | null;
}

export type TicketPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Approval {
  id: string;
  type: string;
  title: string;
  description: string | null;
  requesterName: string;
  status: ApprovalStatus;
  createdAt: string;
  decidedAt: string | null;
  decisionComment: string | null;
}

export interface AssistantSource {
  documentId: string | null;
  title: string;
  url: string | null;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: AssistantSource[];
  feedback: 1 | -1 | null;
  createdAt: string;
}

export interface AssistantConversationSummary {
  id: string;
  title: string | null;
  updatedAt: string;
}

export interface AssistantChatResponse {
  conversationId: string;
  message: AssistantMessage;
}

export interface NotificationPreference {
  category: NotificationCategory;
  enabled: boolean;
}

export interface RagSource {
  id: string;
  name: string;
  type: string;
  isEnabled: boolean;
  lastSyncedAt: string | null;
}

/** Konfiguration, die der Administrator in app_settings pflegt */
export interface RemoteConfig {
  links: { veda: { url: string; label: string } | null };
}

export interface Employee {
  id: string;
  displayName: string;
  jobTitle: string | null;
  departmentName: string | null;
  locationName: string | null;
  email: string;
  phoneOffice: string | null;
  phoneMobile: string | null;
  managerId: string | null;
  managerName: string | null;
}

export interface LocationDto {
  id: string;
  name: string;
}

export interface AdminStatus {
  userCount: number;
  deviceCount: number;
  lastUserSyncAt: string | null;
  ragDocumentCount: number;
  ragSources: RagSource[];
}

export interface PublishPostRequest {
  type: PostType;
  priority: PostPriority;
  /** Sprache, in der Titel und Text verfasst sind. Übersetzungen erzeugt das Backend. */
  language: string;
  title: string;
  body: string;
  sendPush: boolean;
}

export interface SecurityAlertRequest {
  title: string;
  message: string;
  /** null = alle Standorte */
  locationId: string | null;
}
