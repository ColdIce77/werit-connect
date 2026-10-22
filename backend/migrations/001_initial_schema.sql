-- Up Migration
-- WERIT Connect · Initiales Schema (PostgreSQL 16)
-- Azure Database for PostgreSQL: Die Erweiterungen "vector" und "pg_trgm"
-- müssen im Serverparameter azure.extensions freigegeben sein.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE app_role        AS ENUM ('employee', 'team_lead', 'manager', 'admin');
CREATE TYPE post_type       AS ENUM ('news', 'announcement');
CREATE TYPE post_priority   AS ENUM ('normal', 'important');
CREATE TYPE task_status     AS ENUM ('open', 'done', 'cancelled');
CREATE TYPE ticket_status   AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'critical');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE push_category   AS ENUM ('news', 'it_incident', 'security_alert', 'approval');
CREATE TYPE device_platform AS ENUM ('ios', 'android');
CREATE TYPE message_role    AS ENUM ('user', 'assistant');

-- ---------------------------------------------------------------------------
-- Hilfsfunktion: updated_at automatisch pflegen
-- ---------------------------------------------------------------------------
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Sprachen (Deutsch, Englisch, Französisch, weitere durch INSERT ergänzbar)
-- ---------------------------------------------------------------------------
CREATE TABLE languages (
  code        text PRIMARY KEY CHECK (code ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  name        text    NOT NULL,
  native_name text    NOT NULL,
  is_enabled  boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0
);

INSERT INTO languages (code, name, native_name, sort_order) VALUES
  ('de', 'German',  'Deutsch',  1),
  ('en', 'English', 'English',  2),
  ('fr', 'French',  'Français', 3);

-- ---------------------------------------------------------------------------
-- Organisation
-- ---------------------------------------------------------------------------
CREATE TABLE locations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  street       text,
  postal_code  text,
  city         text,
  country_code char(2) NOT NULL DEFAULT 'DE',
  timezone     text NOT NULL DEFAULT 'Europe/Berlin',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

CREATE TABLE departments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  parent_id  uuid REFERENCES departments (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Benutzer (Spiegel aus Entra ID, Quelle der Wahrheit bleibt Entra ID)
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entra_object_id   uuid NOT NULL UNIQUE,
  entra_tenant_id   uuid NOT NULL,
  email             text NOT NULL,
  display_name      text NOT NULL,
  given_name        text,
  surname           text,
  job_title         text,
  department_id     uuid REFERENCES departments (id) ON DELETE SET NULL,
  location_id       uuid REFERENCES locations (id) ON DELETE SET NULL,
  manager_id        uuid REFERENCES users (id) ON DELETE SET NULL,
  phone_office      text,
  phone_mobile      text,
  hire_date         date,
  -- Datensparsamkeit: nur Tag und Monat, Anzeige nur mit Einwilligung
  birth_day         smallint CHECK (birth_day BETWEEN 1 AND 31),
  birth_month       smallint CHECK (birth_month BETWEEN 1 AND 12),
  show_birthday     boolean NOT NULL DEFAULT false,
  show_in_directory boolean NOT NULL DEFAULT true,
  language          text NOT NULL DEFAULT 'de' REFERENCES languages (code),
  is_active         boolean NOT NULL DEFAULT true,
  last_login_at     timestamptz,
  synced_at         timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_birthday_complete CHECK ((birth_day IS NULL) = (birth_month IS NULL))
);

CREATE UNIQUE INDEX users_email_key         ON users (lower(email));
CREATE INDEX users_display_name_trgm        ON users USING gin (display_name gin_trgm_ops);
CREATE INDEX users_job_title_trgm           ON users USING gin (job_title gin_trgm_ops);
CREATE INDEX users_department_idx           ON users (department_id);
CREATE INDEX users_location_idx             ON users (location_id);
CREATE INDEX users_manager_idx              ON users (manager_id);
CREATE INDEX users_updated_at_idx           ON users (updated_at);

-- ---------------------------------------------------------------------------
-- Rollen und Berechtigungen
-- Jeder aktive Benutzer ist implizit "employee". Die effektiven Berechtigungen
-- sind die Vereinigung aller Rollen des Benutzers.
-- ---------------------------------------------------------------------------
CREATE TABLE permissions (
  key         text PRIMARY KEY,
  description text NOT NULL
);

CREATE TABLE role_permissions (
  role       app_role NOT NULL,
  permission text     NOT NULL REFERENCES permissions (key) ON DELETE CASCADE,
  PRIMARY KEY (role, permission)
);

CREATE TABLE user_roles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role          app_role NOT NULL,
  -- Zuständigkeitsbereich bei team_lead und manager (NULL = global, z. B. admin)
  department_id uuid REFERENCES departments (id) ON DELETE CASCADE,
  source        text NOT NULL DEFAULT 'entra' CHECK (source IN ('entra', 'manual')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (user_id, role, department_id)
);

CREATE INDEX user_roles_user_idx ON user_roles (user_id);

INSERT INTO permissions (key, description) VALUES
  ('content.read',          'News, Verzeichnis, Dokumente, Sicherheit und Notfallkontakte lesen'),
  ('assistant.use',         'KI-Assistent nutzen'),
  ('ticket.create',         'Eigene Tickets melden und einsehen'),
  ('approval.decide',       'Freigaben im eigenen Team bzw. Bereich erteilen'),
  ('post.publish',          'News und Ankündigungen veröffentlichen'),
  ('security_alert.publish','Sicherheitswarnungen auslösen'),
  ('admin.manage',          'Benutzer, Inhalte, Einstellungen und KI-Quellen verwalten');

INSERT INTO role_permissions (role, permission) VALUES
  ('employee',  'content.read'),
  ('employee',  'assistant.use'),
  ('employee',  'ticket.create'),
  ('team_lead', 'content.read'),
  ('team_lead', 'assistant.use'),
  ('team_lead', 'ticket.create'),
  ('team_lead', 'approval.decide'),
  ('manager',   'content.read'),
  ('manager',   'assistant.use'),
  ('manager',   'ticket.create'),
  ('manager',   'approval.decide'),
  ('manager',   'post.publish'),
  ('manager',   'security_alert.publish'),
  ('admin',     'content.read'),
  ('admin',     'assistant.use'),
  ('admin',     'ticket.create'),
  ('admin',     'post.publish'),
  ('admin',     'security_alert.publish'),
  ('admin',     'admin.manage');

-- ---------------------------------------------------------------------------
-- Geräte und Push
-- ---------------------------------------------------------------------------
CREATE TABLE devices (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  platform         device_platform NOT NULL,
  push_token       text UNIQUE,
  app_version      text,
  os_version       text,
  language         text REFERENCES languages (code),
  intune_device_id text,
  last_seen_at     timestamptz NOT NULL DEFAULT now(),
  revoked_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX devices_user_idx ON devices (user_id) WHERE revoked_at IS NULL;

CREATE TABLE notification_preferences (
  user_id  uuid          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  category push_category NOT NULL,
  enabled  boolean       NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, category),
  -- Sicherheitswarnungen sind nicht abschaltbar
  CONSTRAINT security_alert_always_on CHECK (category <> 'security_alert' OR enabled)
);

CREATE TABLE notifications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category       push_category NOT NULL,
  is_urgent      boolean NOT NULL DEFAULT false,
  -- {"de": {"title": "...", "body": "..."}, "en": {...}}; Deutsch ist Pflicht
  content        jsonb NOT NULL,
  reference_type text,
  reference_id   uuid,
  created_by     uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_has_de CHECK (content ? 'de')
);

CREATE TABLE notification_recipients (
  notification_id uuid NOT NULL REFERENCES notifications (id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  delivered_at    timestamptz,
  read_at         timestamptz,
  PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX notification_recipients_inbox_idx ON notification_recipients (user_id, read_at);

CREATE TABLE notification_deliveries (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notification_id uuid NOT NULL REFERENCES notifications (id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  device_id       uuid REFERENCES devices (id) ON DELETE SET NULL,
  status          text NOT NULL CHECK (status IN ('sent', 'failed', 'invalid_token')),
  error           text,
  sent_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notification_deliveries_notification_idx ON notification_deliveries (notification_id);

-- ---------------------------------------------------------------------------
-- News und Ankündigungen (mehrsprachig)
-- ---------------------------------------------------------------------------
CREATE TABLE posts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type             post_type     NOT NULL,
  priority         post_priority NOT NULL DEFAULT 'normal',
  author_id        uuid REFERENCES users (id) ON DELETE SET NULL,
  default_language text NOT NULL DEFAULT 'de' REFERENCES languages (code),
  image_url        text,
  publish_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz,
  -- Zielgruppe: NULL = alle
  location_id      uuid REFERENCES locations (id) ON DELETE SET NULL,
  department_id    uuid REFERENCES departments (id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz
);

CREATE INDEX posts_feed_idx ON posts (type, publish_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE post_translations (
  post_id  uuid NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  language text NOT NULL REFERENCES languages (code),
  title    text NOT NULL,
  summary  text,
  body     text NOT NULL,
  PRIMARY KEY (post_id, language)
);

-- ---------------------------------------------------------------------------
-- Persönliche Aufgaben
-- ---------------------------------------------------------------------------
CREATE TABLE tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignee_id  uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_by   uuid REFERENCES users (id) ON DELETE SET NULL,
  title        text NOT NULL,
  description  text,
  due_at       timestamptz,
  status       task_status NOT NULL DEFAULT 'open',
  -- optionaler Bezug, z. B. ('safety_instruction', <id>)
  ref_type     text,
  ref_id       uuid,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tasks_assignee_idx ON tasks (assignee_id, status, due_at);

-- ---------------------------------------------------------------------------
-- Tickets (Platzhalter, Anbindung an NinjaOne wird später definiert)
-- ---------------------------------------------------------------------------
CREATE TABLE tickets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  external_system   text NOT NULL DEFAULT 'ninjaone',
  external_id       text,
  title             text NOT NULL,
  description       text,
  category          text,
  status            ticket_status   NOT NULL DEFAULT 'open',
  priority          ticket_priority NOT NULL DEFAULT 'normal',
  -- Idempotenzschlüssel der Offline-Outbox
  client_request_id uuid UNIQUE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  synced_at         timestamptz,
  UNIQUE (external_system, external_id)
);

CREATE INDEX tickets_requester_idx ON tickets (requester_id, status);

-- ---------------------------------------------------------------------------
-- Freigaben (Platzhalter, Quellen werden später definiert)
-- ---------------------------------------------------------------------------
CREATE TABLE approvals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type             text NOT NULL,
  title            text NOT NULL,
  description      text,
  requester_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  approver_id      uuid REFERENCES users (id) ON DELETE SET NULL,
  status           approval_status NOT NULL DEFAULT 'pending',
  payload          jsonb NOT NULL DEFAULT '{}',
  external_system  text,
  external_id      text,
  decided_at       timestamptz,
  decision_comment text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX approvals_approver_idx  ON approvals (approver_id, status);
CREATE INDEX approvals_requester_idx ON approvals (requester_id);

-- ---------------------------------------------------------------------------
-- Dokumente (Metadaten, Inhalte liegen in SharePoint)
-- Der Download läuft über das Backend mit den Rechten des Nutzers.
-- ---------------------------------------------------------------------------
CREATE TABLE documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source        text NOT NULL DEFAULT 'sharepoint',
  external_id   text NOT NULL,
  title         text NOT NULL,
  language      text REFERENCES languages (code),
  mime_type     text,
  size_bytes    bigint,
  version       text,
  web_url       text NOT NULL,
  category      text,
  location_id   uuid REFERENCES locations (id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments (id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,
  UNIQUE (source, external_id)
);

CREATE INDEX documents_title_trgm ON documents USING gin (title gin_trgm_ops);
CREATE INDEX documents_updated_idx ON documents (updated_at);

CREATE TABLE document_reads (
  user_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  document_id  uuid NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  read_count   integer NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, document_id)
);

CREATE INDEX document_reads_recent_idx ON document_reads (user_id, last_read_at DESC);

-- ---------------------------------------------------------------------------
-- Sicherheitsunterweisungen (offlinefähig, mit Lesebestätigung)
-- ---------------------------------------------------------------------------
CREATE TABLE safety_instructions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  version       integer NOT NULL DEFAULT 1,
  is_mandatory  boolean NOT NULL DEFAULT true,
  valid_from    date NOT NULL DEFAULT current_date,
  valid_until   date,
  location_id   uuid REFERENCES locations (id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments (id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE TABLE safety_instruction_translations (
  instruction_id uuid NOT NULL REFERENCES safety_instructions (id) ON DELETE CASCADE,
  language       text NOT NULL REFERENCES languages (code),
  title          text NOT NULL,
  summary        text,
  body           text NOT NULL,
  file_url       text,
  PRIMARY KEY (instruction_id, language)
);

CREATE TABLE safety_acknowledgements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  instruction_id  uuid    NOT NULL REFERENCES safety_instructions (id) ON DELETE CASCADE,
  version         integer NOT NULL,
  -- Zeitpunkt auf dem Gerät (kann offline entstanden sein) und Eingang im Backend
  acknowledged_at timestamptz NOT NULL,
  received_at     timestamptz NOT NULL DEFAULT now(),
  device_id       uuid REFERENCES devices (id) ON DELETE SET NULL,
  -- Idempotenzschlüssel der Offline-Outbox
  client_event_id uuid NOT NULL UNIQUE,
  UNIQUE (user_id, instruction_id, version)
);

-- ---------------------------------------------------------------------------
-- Notfallkontakte (offlinefähig, mehrsprachig)
-- ---------------------------------------------------------------------------
CREATE TABLE emergency_contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULL = gilt an allen Standorten
  location_id uuid REFERENCES locations (id) ON DELETE CASCADE,
  category    text NOT NULL,
  phone       text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

CREATE TABLE emergency_contact_translations (
  contact_id  uuid NOT NULL REFERENCES emergency_contacts (id) ON DELETE CASCADE,
  language    text NOT NULL REFERENCES languages (code),
  label       text NOT NULL,
  description text,
  PRIMARY KEY (contact_id, language)
);

-- ---------------------------------------------------------------------------
-- KI-Assistent (RAG)
-- Embedding-Dimension 1536 entspricht text-embedding-3-small (Azure OpenAI).
-- Bei Modellwechsel mit anderer Dimension ist eine Neuindizierung nötig.
-- ---------------------------------------------------------------------------
CREATE TABLE rag_sources (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  type           text NOT NULL,
  config         jsonb NOT NULL DEFAULT '{}',
  is_enabled     boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rag_documents (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id            uuid NOT NULL REFERENCES rag_sources (id) ON DELETE CASCADE,
  external_id          text NOT NULL,
  title                text NOT NULL,
  url                  text,
  language             text REFERENCES languages (code),
  content_hash         text NOT NULL,
  -- Zugriffsfilter beim Retrieval; NULL = keine Einschränkung
  allowed_roles        app_role[],
  allowed_location_ids uuid[],
  allowed_entra_groups uuid[],
  indexed_at           timestamptz NOT NULL DEFAULT now(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz,
  UNIQUE (source_id, external_id)
);

CREATE TABLE rag_chunks (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  document_id uuid    NOT NULL REFERENCES rag_documents (id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content     text    NOT NULL,
  token_count integer,
  embedding   vector(1536) NOT NULL,
  UNIQUE (document_id, chunk_index)
);

CREATE INDEX rag_chunks_embedding_idx ON rag_chunks USING hnsw (embedding vector_cosine_ops);

CREATE TABLE assistant_conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title      text,
  language   text REFERENCES languages (code),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Löschfrist (Vorschlag 90 Tage, mit Datenschutz abstimmen)
  expires_at timestamptz NOT NULL DEFAULT now() + interval '90 days'
);

CREATE INDEX assistant_conversations_user_idx ON assistant_conversations (user_id, updated_at DESC);
CREATE INDEX assistant_conversations_expiry_idx ON assistant_conversations (expires_at);

CREATE TABLE assistant_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES assistant_conversations (id) ON DELETE CASCADE,
  role            message_role NOT NULL,
  content         text NOT NULL,
  -- [{"documentId": "...", "title": "...", "url": "..."}]
  sources         jsonb NOT NULL DEFAULT '[]',
  feedback        smallint CHECK (feedback IN (-1, 1)),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX assistant_messages_conversation_idx ON assistant_messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Einstellungen und Audit
-- ---------------------------------------------------------------------------
CREATE TABLE app_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users (id) ON DELETE SET NULL
);

-- Platzhalter: genaue URL von VEDA.net eintragen
INSERT INTO app_settings (key, value) VALUES
  ('links.veda', '{"url": "https://veda.net", "labels": {"de": "VEDA öffnen", "en": "Open VEDA", "fr": "Ouvrir VEDA"}}');

CREATE TABLE audit_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id    uuid REFERENCES users (id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text,
  entity_id   text,
  details     jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_created_idx ON audit_log (created_at DESC);
CREATE INDEX audit_log_entity_idx  ON audit_log (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- updated_at-Trigger für alle Tabellen mit dieser Spalte
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'locations', 'departments', 'users', 'posts', 'tasks', 'tickets', 'approvals',
    'documents', 'safety_instructions', 'emergency_contacts', 'rag_sources',
    'rag_documents', 'assistant_conversations', 'app_settings'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t || '_set_updated_at', t
    );
  END LOOP;
END;
$$;

-- Down Migration
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS app_settings;
DROP TABLE IF EXISTS assistant_messages;
DROP TABLE IF EXISTS assistant_conversations;
DROP TABLE IF EXISTS rag_chunks;
DROP TABLE IF EXISTS rag_documents;
DROP TABLE IF EXISTS rag_sources;
DROP TABLE IF EXISTS emergency_contact_translations;
DROP TABLE IF EXISTS emergency_contacts;
DROP TABLE IF EXISTS safety_acknowledgements;
DROP TABLE IF EXISTS safety_instruction_translations;
DROP TABLE IF EXISTS safety_instructions;
DROP TABLE IF EXISTS document_reads;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS approvals;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS post_translations;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS notification_deliveries;
DROP TABLE IF EXISTS notification_recipients;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS notification_preferences;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS languages;
DROP FUNCTION IF EXISTS set_updated_at();
DROP TYPE IF EXISTS message_role;
DROP TYPE IF EXISTS device_platform;
DROP TYPE IF EXISTS push_category;
DROP TYPE IF EXISTS approval_status;
DROP TYPE IF EXISTS ticket_priority;
DROP TYPE IF EXISTS ticket_status;
DROP TYPE IF EXISTS task_status;
DROP TYPE IF EXISTS post_priority;
DROP TYPE IF EXISTS post_type;
DROP TYPE IF EXISTS app_role;
