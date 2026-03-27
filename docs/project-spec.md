# MarkWrite -- Project Specification

> Version: 1.0
> Last Updated: 2026-03-24
> Status: Active Development

---

## 1. Executive Summary

MarkWrite is a professional, collaborative Markdown writing environment where team
members can simultaneously edit documents with real-time feedback and robust
synchronization. It addresses the common pain point of disjointed documentation
workflows and conflicting edits when using traditional file-based or less responsive
online editors.

### 1.1 Problem Statement

Teams working on documentation face:

- Conflicting edits when multiple people modify the same file
- Version control friction with manual merge conflicts
- Lack of real-time visibility into who is editing what
- Poor offline support in existing cloud editors
- Context switching between editing and previewing Markdown

### 1.2 Solution

A web-based Markdown editor using CRDT (Conflict-free Replicated Data Types)
technology that enables:

- True real-time collaboration with automatic conflict resolution
- Offline-first architecture that syncs when reconnected
- Live presence awareness showing collaborator cursors and selections
- Instant Markdown preview alongside the editor

---

## 2. User Personas

### 2.1 Primary: Technical Writer (Sarah)

- **Background:** Documentation lead at a software company
- **Goals:** Create and maintain docs with her team efficiently
- **Pain Points:** Google Docs lacks Markdown; Git-based wikis have merge conflicts
- **Needs:** Real-time editing, Markdown support, version history

### 2.2 Secondary: Open Source Maintainer (Marcus)

- **Background:** Maintains popular OSS projects
- **Goals:** Collaborate on README, CONTRIBUTING, and wiki pages
- **Pain Points:** GitHub's editor is single-user; no live preview
- **Needs:** Shareable links, GitHub integration, clean export

### 2.3 Tertiary: Student Team (Jordan's Group)

- **Background:** CS students working on group project documentation
- **Goals:** Write project reports together without conflicts
- **Pain Points:** Email attachments, overwriting each other's work
- **Needs:** Free tier, simple sharing, no setup required

---

## 3. Functional Requirements

### 3.1 User Authentication

| ID      | Requirement                              | Priority |
| ------- | ---------------------------------------- | -------- |
| AUTH-01 | Users can sign in with GitHub OAuth      | Must     |
| AUTH-02 | Sessions persist across browser restarts | Must     |
| AUTH-03 | Users can sign out from any device       | Must     |
| AUTH-04 | Future: Email/password authentication    | Could    |

### 3.2 Document Management

| ID     | Requirement                                             | Priority |
| ------ | ------------------------------------------------------- | -------- |
| DOC-01 | Users can create new documents                          | Must     |
| DOC-02 | Users can view a list of their documents                | Must     |
| DOC-03 | Users can rename documents                              | Must     |
| DOC-04 | Users can delete documents (soft delete, recoverable)   | Should   |
| DOC-05 | Documents have automatic timestamps (created, modified) | Must     |
| DOC-06 | Users can search their documents by title               | Should   |
| DOC-07 | Users can organize documents into folders               | Could    |

### 3.3 Real-time Collaboration

| ID        | Requirement                                              | Priority |
| --------- | -------------------------------------------------------- | -------- |
| COLLAB-01 | Multiple users can edit the same document simultaneously | Must     |
| COLLAB-02 | Edits appear in real-time (< 100ms latency on LAN)       | Must     |
| COLLAB-03 | Conflicts are resolved automatically without data loss   | Must     |
| COLLAB-04 | Users see other collaborators' cursors with name labels  | Must     |
| COLLAB-05 | Users see other collaborators' text selections           | Should   |
| COLLAB-06 | Offline edits sync when reconnected                      | Should   |

### 3.4 Sharing and Permissions

| ID       | Requirement                                     | Priority |
| -------- | ----------------------------------------------- | -------- |
| SHARE-01 | Documents have shareable links                  | Must     |
| SHARE-02 | Links can grant "view" or "edit" permission     | Must     |
| SHARE-03 | Document owner can revoke access                | Must     |
| SHARE-04 | Public documents are accessible without sign-in | Should   |

### 3.5 Editor Features

| ID      | Requirement                                            | Priority |
| ------- | ------------------------------------------------------ | -------- |
| EDIT-01 | Full Markdown syntax support (CommonMark + GFM)        | Must     |
| EDIT-02 | Live Markdown preview panel                            | Must     |
| EDIT-03 | Syntax highlighting in the editor                      | Must     |
| EDIT-04 | Keyboard shortcuts for formatting (bold, italic, etc.) | Must     |
| EDIT-05 | Code block syntax highlighting (multi-language)        | Should   |
| EDIT-06 | Table editing support                                  | Should   |
| EDIT-07 | Image upload and embedding                             | Could    |

### 3.6 Version History

| ID     | Requirement                                             | Priority |
| ------ | ------------------------------------------------------- | -------- |
| VER-01 | System saves snapshots periodically (e.g., every 5 min) | Should   |
| VER-02 | Users can view a list of previous versions              | Should   |
| VER-03 | Users can preview a previous version                    | Should   |
| VER-04 | Users can restore a previous version                    | Should   |

### 3.7 Export

| ID     | Requirement                                   | Priority |
| ------ | --------------------------------------------- | -------- |
| EXP-01 | Users can download document as Markdown (.md) | Must     |
| EXP-02 | Users can download document as HTML           | Should   |
| EXP-03 | Users can download document as PDF            | Could    |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID      | Requirement                              | Target  |
| ------- | ---------------------------------------- | ------- |
| PERF-01 | Initial page load (LCP) on 4G connection | < 2.5s  |
| PERF-02 | Time to interactive after load           | < 3.0s  |
| PERF-03 | Editor keystroke latency                 | < 16ms  |
| PERF-04 | Sync latency on stable connection        | < 100ms |
| PERF-05 | Handle documents up to 100,000 words     | Yes     |

### 4.2 Reliability

| ID     | Requirement                                  | Target |
| ------ | -------------------------------------------- | ------ |
| REL-01 | System uptime                                | 99.5%  |
| REL-02 | No data loss on server crash (persistence)   | Zero   |
| REL-03 | Graceful degradation on WebSocket disconnect | Yes    |

### 4.3 Security

| ID     | Requirement                          | Target   |
| ------ | ------------------------------------ | -------- |
| SEC-01 | All traffic over HTTPS               | Required |
| SEC-02 | WebSocket connections authenticated  | Required |
| SEC-03 | Document access enforced server-side | Required |
| SEC-04 | No secrets in client bundle          | Required |
| SEC-05 | Passed OWASP Top 10 review           | Should   |

### 4.4 Accessibility

| ID      | Requirement                  | Target |
| ------- | ---------------------------- | ------ |
| A11Y-01 | WCAG 2.1 Level AA compliance | Should |
| A11Y-02 | Full keyboard navigation     | Must   |
| A11Y-03 | Screen reader compatible     | Should |

---

## 5. User Interface Wireframes

### 5.1 Document List Page

```
+---------------------------------------------------------------+
|  [Logo] MarkWrite                    [Avatar] Ahmed [Logout]  |
+---------------------------------------------------------------+
|                                                               |
|  My Documents                              [+ New Document]   |
|                                                               |
|  +----------------------------------------------------------+|
|  | > Project Proposal        | 5 min ago  | [Share] [...]  ||
|  +----------------------------------------------------------+|
|  | > API Documentation       | 2 hours    | [Share] [...]  ||
|  +----------------------------------------------------------+|
|  | > Meeting Notes           | Yesterday  | [Share] [...]  ||
|  +----------------------------------------------------------+|
|                                                               |
+---------------------------------------------------------------+
```

### 5.2 Editor Page

```
+---------------------------------------------------------------+
|  [<] Back  |  Project Proposal  |  [Share] [History] [Export] |
+---------------------------------------------------------------+
|  [Online: Ahmed, Sarah]                                       |
+---------------------------------------------------------------+
|                          |                                    |
|  # Project Proposal      |  Project Proposal                  |
|                          |  =================                 |
|  ## Introduction         |                                    |
|                          |  Introduction                      |
|  This project aims to... |  ------------                      |
|  |                       |                                    |
|  [Cursor: Sarah]         |  This project aims to...           |
|                          |                                    |
|  EDITOR (Markdown)       |  PREVIEW (Rendered)                |
+---------------------------------------------------------------+
```

---

## 6. Technical Architecture

### 6.1 Tech Stack

| Component      | Technology                           |
| -------------- | ------------------------------------ |
| Frontend       | SvelteKit 2 + Svelte 5 + TypeScript  |
| Styling        | Tailwind CSS + shadcn-svelte         |
| Editor         | CodeMirror 6 (code editor)           |
| Preview        | marked (Markdown parser)             |
| Sync (CRDT)    | Yjs                                  |
| WebSocket      | Hocuspocus                           |
| Database       | PostgreSQL 16                        |
| ORM            | Drizzle                              |
| Auth           | Lucia (session-based, GitHub OAuth)  |
| Hosting Web    | Vercel                               |
| Hosting WS     | Railway                              |
| CI/CD          | GitHub Actions                       |
| Error Tracking | Sentry                               |
| Coverage       | Codecov                              |

### 6.2 Data Flow

```
[User A Types]
     |
     v
[CodeMirror Editor] --> [Local Yjs Document] --> [yjs-utils]
     |
     | (Yjs State Encoding)
     v
[API State Endpoint] --> [PostgreSQL]
     |
     | (Future: WebSocket)
     v
[User B's Yjs Document] --> [CodeMirror Editor]
```

### 6.3 Database Schema

See `docs/diagrams/` for full ERD. Key tables:

- `users` -- GitHub OAuth identity
- `sessions` -- Lucia session tokens
- `documents` -- Metadata + serialized Yjs state
- `document_collaborators` -- Sharing permissions
- `document_versions` -- Snapshot history

---

## 7. Acceptance Criteria (MVP)

The first release is complete when:

```
[*] User can sign in with GitHub and see their document list
[*] User can create a new document and edit it with CodeMirror
[*] Two users editing the same document see real-time updates
[*] User cursors and names are visible to collaborators
[*] User can generate a shareable link with edit/view permissions
[*] Document state persists across browser sessions
[*] User can download document as Markdown file
[*] Application is deployed to production (Vercel + Railway)
[*] CI passes lint, format, test, and build checks
[*] Test coverage >= 70%
```

---

## 8. Out of Scope (V1)

The following are explicitly deferred to future releases:

- Email/password authentication
- Folder organization
- Image uploads
- PDF export
- Mobile-native apps
- Comments and annotations
- Real-time chat/voice
- GitHub repository sync

---

## 9. Success Metrics

| Metric                      | Target (3 months post-launch) |
| --------------------------- | ----------------------------- |
| Registered users            | 100+                          |
| Documents created           | 500+                          |
| Concurrent editing sessions | 10+ (simultaneously)          |
| Average sync latency        | < 150ms                       |
| Error rate (Sentry)         | < 1%                          |

---

## 10. Glossary

| Term       | Definition                                                    |
| ---------- | ------------------------------------------------------------- |
| CRDT       | Conflict-free Replicated Data Type; a data structure that     |
|            | allows concurrent updates without coordination.               |
| Yjs        | A CRDT implementation for collaborative editing.              |
| Hocuspocus | A production-ready WebSocket backend for Yjs.                 |
| CodeMirror | A code editor library for the web, used for Markdown editing. |
| marked     | A fast Markdown parser and compiler for rendering previews.   |
| Presence   | Awareness of which users are online and where their cursors   |
|            | are located within a document.                                |

---

> This specification is versioned alongside the codebase. Propose changes via PR.
