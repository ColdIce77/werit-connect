# WERIT Connect – API-Vertrag (App → Backend)

Stand 22.10.2026. Grundlage für Phase 5 (Backend). Alle Pfade relativ zur API-Basis-URL, Authentifizierung per Bearer-Token (Entra ID). Typen: `mobile/src/shared/api/types.ts`.

| Bereich | Endpunkte |
|---|---|
| Profil | `GET /me` · `PATCH /me/settings {language}` · `GET/PUT /me/notification-preferences` · `GET /app-config` (u. a. `links.veda`) |
| Start | `GET /dashboard` · `GET /posts` · `GET /posts/:id` · `POST /posts` (post.publish) · `GET /tasks` · `POST /tasks/:id/complete\|reopen` |
| Verzeichnis, Offline | `GET /directory` · `GET /directory/sync` · `GET /emergency-contacts/sync` · `GET /safety/sync` (Delta-Sync, `SyncPage<T>`) |
| Sicherheit | `POST /safety/acknowledgements` (idempotent über `clientEventId`; 409 = bereits erfasst) |
| Dokumente | `GET /documents` · `GET /documents/:id` · Datei-Download |
| Assistent (RAG) | `POST /assistant/messages` · `GET /assistant/conversations` · `GET /assistant/conversations/:id/messages` · `DELETE /assistant/conversations/:id` · `POST /assistant/messages/:id/feedback` |
| Tickets | `GET /tickets` · `GET /tickets/:id` · `POST /tickets` (idempotent über `clientRequestId`) |
| Freigaben | `GET /approvals?status=pending\|decided` · `GET /approvals/:id` · `POST /approvals/:id/decision {decision, comment}` |
| Posteingang, Push | `GET /notifications` · `GET /notifications/:id` · `GET /notifications/unread-count` · `POST /notifications/:id/read` · `POST /notifications/read-all` · `POST /devices` |
| Administration | `POST /security-alerts` (security_alert.publish) · `GET /locations` · `GET /admin/status` · `POST /admin/sync/users` · `POST /admin/rag/reindex` (admin.manage) |

Regeln für den Outbox-Versand (App): Netzfehler, 401, 408, 429 und 5xx werden wiederholt; 409 gilt als erledigt; andere 4xx werden verworfen und dem Nutzer gemeldet.
