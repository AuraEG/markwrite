# MarkWrite Architecture

> **Version:** 1.0  
> **Last Updated:** 2026-04-04  
> **Status:** Production

This document provides a comprehensive overview of MarkWrite's system architecture, design decisions, and technical implementation details.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Context](#2-system-context)
3. [Container Architecture](#3-container-architecture)
4. [Component Architecture](#4-component-architecture)
5. [Data Architecture](#5-data-architecture)
6. [Real-time Collaboration Architecture](#6-real-time-collaboration-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Technology Decisions](#9-technology-decisions)

---

## 1. Introduction

### 1.1 Purpose

MarkWrite is a professional, web-based Markdown editor that enables real-time collaboration without conflicts. This document describes the architectural decisions, system components, and their interactions that make this possible.

### 1.2 Architectural Goals

| Goal                        | Description                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| **Real-time Collaboration** | Multiple users must be able to edit the same document simultaneously with sub-second latency    |
| **Conflict-free Editing**   | Concurrent edits must merge automatically without data loss or manual resolution                |
| **Offline Support**         | Users should be able to continue editing when disconnected, with automatic sync on reconnection |
| **Scalability**             | The system must handle multiple concurrent editing sessions across many documents               |
| **Security**                | Document access must be strictly controlled with authentication and authorization               |
| **Maintainability**         | Clear separation of concerns with well-defined component boundaries                             |

### 1.3 Architectural Style

MarkWrite follows a **hybrid architecture** combining:

- **Monorepo Structure** - All applications and shared code in a single repository managed by Turborepo
- **Event-driven Real-time** - WebSocket-based communication for collaborative editing using CRDT
- **REST API** - Traditional HTTP endpoints for CRUD operations and authentication
- **Server-side Rendering** - SvelteKit for initial page loads with client-side hydration

---

## 2. System Context

The System Context diagram shows MarkWrite's position within the broader ecosystem and its interactions with external systems.

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart TB
    subgraph Users["Users"]
        TW["Technical Writer"]
        DEV["Developer"]
        STU["Student"]
    end

    subgraph MarkWrite["MarkWrite System"]
        direction TB
        MW["MarkWrite Platform<br/>━━━━━━━━━━━━━━━━━<br/>Real-time collaborative<br/>Markdown editing platform"]
    end

    subgraph External["External Systems"]
        GH["GitHub<br/>━━━━━━━━━━<br/>OAuth Provider"]
        GIST["GitHub Gist API<br/>━━━━━━━━━━<br/>Public Sharing"]
    end

    TW -->|"Creates and edits<br/>documentation"| MW
    DEV -->|"Collaborates on<br/>technical specs"| MW
    STU -->|"Works on group<br/>projects"| MW

    MW <-->|"OAuth 2.0<br/>Authentication"| GH
    MW -->|"Creates public Gists<br/>for document sharing"| GIST

    style MW fill:#2563eb,color:#fff,stroke:#1d4ed8
    style GH fill:#6b7280,color:#fff
    style GIST fill:#6b7280,color:#fff
    style TW fill:#1e40af,color:#fff
    style DEV fill:#1e40af,color:#fff
    style STU fill:#1e40af,color:#fff
```

### 2.1 User Types

| User Type            | Primary Use Case                                      | Key Requirements                                        |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| **Technical Writer** | Documentation lead creating and maintaining team docs | Real-time collaboration, version history, clean exports |
| **Developer**        | Open source maintainer working on README and wikis    | GitHub integration, Markdown support, shareable links   |
| **Student**          | Group project documentation                           | Free access, simple sharing, no conflicts               |

### 2.2 External System Integrations

| System              | Integration Type | Purpose                                                                            |
| ------------------- | ---------------- | ---------------------------------------------------------------------------------- |
| **GitHub OAuth**    | Authentication   | Single sign-on using GitHub credentials, access to user profile (username, avatar) |
| **GitHub Gist API** | Data Export      | Create public Gists from documents for easy sharing outside the platform           |

---

## 3. Container Architecture

The Container diagram shows the high-level technical components that make up MarkWrite.

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart TB
    subgraph Client["Client Layer"]
        Browser["Web Browser<br/>━━━━━━━━━━<br/>SPA with SSR hydration"]
    end

    subgraph Application["Application Layer"]
        subgraph WebContainer["Web Application"]
            Web["SvelteKit Application<br/>━━━━━━━━━━━━━━━━━━━━<br/>- Server-side rendering<br/>- REST API endpoints<br/>- Authentication handling<br/>- Static asset serving<br/>━━━━━━━━━━━━━━━━━━━━<br/>Technology: SvelteKit 2<br/>Port: 5173 (dev) / 443 (prod)"]
        end

        subgraph SyncContainer["Sync Server"]
            Sync["Hocuspocus Server<br/>━━━━━━━━━━━━━━━━━━━━<br/>- WebSocket connections<br/>- Yjs document sync<br/>- Presence awareness<br/>- Rate limiting<br/>━━━━━━━━━━━━━━━━━━━━<br/>Technology: Hocuspocus<br/>Port: 1234 (dev) / 443 (prod)"]
        end
    end

    subgraph Data["Data Layer"]
        DB[("PostgreSQL Database<br/>━━━━━━━━━━━━━━━━━━━━<br/>- User accounts<br/>- Document metadata<br/>- Yjs state storage<br/>- Version history<br/>━━━━━━━━━━━━━━━━━━━━<br/>Version: PostgreSQL 16")]
    end

    Browser <-->|"HTTPS<br/>REST API"| Web
    Browser <-->|"WSS<br/>Yjs Protocol"| Sync
    Web <-->|"SQL<br/>Drizzle ORM"| DB
    Sync <-->|"SQL<br/>postgres.js"| DB
    Web -.->|"HTTP<br/>Session Validation"| Sync

    style Browser fill:#1e40af,color:#fff
    style Web fill:#2563eb,color:#fff,stroke:#1d4ed8
    style Sync fill:#2563eb,color:#fff,stroke:#1d4ed8
    style DB fill:#059669,color:#fff,stroke:#047857
```

### 3.1 Web Application Container

The SvelteKit application serves as the primary interface for users and handles all non-real-time operations.

**Responsibilities:**

- Render the user interface (documents list, editor, settings)
- Handle user authentication via GitHub OAuth
- Provide REST API endpoints for document CRUD operations
- Manage user sessions and authorization
- Serve static assets (JavaScript, CSS, images)

**Technology Stack:**
| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | SvelteKit 2 | Full-stack web framework |
| Language | TypeScript 5 | Type-safe development |
| UI Library | shadcn-svelte | Accessible component library |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| Database Access | Drizzle ORM | Type-safe SQL queries |
| Authentication | Lucia v3 | Session management |
| Validation | Zod | Runtime type validation |

### 3.2 Sync Server Container

The Hocuspocus server manages all real-time collaboration features using WebSocket connections.

**Responsibilities:**

- Maintain WebSocket connections with all active editors
- Synchronize Yjs document state between clients
- Broadcast presence information (cursors, selections)
- Persist document state to the database
- Enforce rate limits and connection policies

**Technology Stack:**
| Component | Technology | Purpose |
|-----------|------------|---------|
| Server | Hocuspocus | WebSocket server for Yjs |
| Runtime | Node.js 20 | Server runtime |
| Database | postgres.js | Direct PostgreSQL access |
| CRDT | Yjs | Conflict-free data types |

### 3.3 Database Container

PostgreSQL serves as the single source of truth for all persistent data.

**Stored Data:**

- User accounts and profiles
- Session tokens
- Document metadata and Yjs binary state
- Sharing permissions and collaborator lists
- Version history snapshots
- User preferences and settings

---

## 4. Component Architecture

### 4.1 Web Application Components

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart TB
    subgraph Presentation["Presentation Layer"]
        direction TB
        Routes["Route Handlers<br/>━━━━━━━━━━<br/>+page.svelte<br/>+layout.svelte"]
        Pages["Page Components<br/>━━━━━━━━━━<br/>DocumentList<br/>DocumentEditor<br/>Settings"]
        UI["UI Components<br/>━━━━━━━━━━<br/>Button, Dialog<br/>Dropdown, Toast<br/>(shadcn-svelte)"]
    end

    subgraph Editor["Editor Layer"]
        direction TB
        Tiptap["Tiptap Editor<br/>━━━━━━━━━━<br/>Rich text editing<br/>ProseMirror core"]
        Extensions["Editor Extensions<br/>━━━━━━━━━━<br/>Collaboration<br/>Placeholder<br/>Link"]
        Markdown["Markdown Processing<br/>━━━━━━━━━━<br/>marked (rendering)<br/>highlight.js<br/>KaTeX"]
    end

    subgraph Collaboration["Collaboration Layer"]
        direction TB
        YDoc["Yjs Document<br/>━━━━━━━━━━<br/>CRDT state<br/>Change tracking"]
        Provider["Hocuspocus Provider<br/>━━━━━━━━━━<br/>WebSocket client<br/>Reconnection"]
        Awareness["Awareness Protocol<br/>━━━━━━━━━━<br/>Cursor positions<br/>User presence"]
    end

    subgraph API["API Layer"]
        direction TB
        Endpoints["API Endpoints<br/>━━━━━━━━━━<br/>/api/documents<br/>/api/user<br/>/api/auth"]
        Validators["Request Validators<br/>━━━━━━━━━━<br/>Zod schemas<br/>Type inference"]
    end

    subgraph Server["Server Layer"]
        direction TB
        Auth["Authentication<br/>━━━━━━━━━━<br/>Lucia adapter<br/>GitHub OAuth<br/>Session mgmt"]
        DB["Database Access<br/>━━━━━━━━━━<br/>Drizzle ORM<br/>Query builders<br/>Transactions"]
    end

    Routes --> Pages
    Pages --> UI
    Pages --> Tiptap
    Tiptap --> Extensions
    Extensions --> Markdown
    Tiptap <--> YDoc
    YDoc <--> Provider
    YDoc <--> Awareness
    Routes --> Endpoints
    Endpoints --> Validators
    Endpoints --> Auth
    Endpoints --> DB

    style Routes fill:#3b82f6,color:#fff
    style Pages fill:#3b82f6,color:#fff
    style UI fill:#3b82f6,color:#fff
    style Tiptap fill:#8b5cf6,color:#fff
    style Extensions fill:#8b5cf6,color:#fff
    style Markdown fill:#8b5cf6,color:#fff
    style YDoc fill:#ec4899,color:#fff
    style Provider fill:#ec4899,color:#fff
    style Awareness fill:#ec4899,color:#fff
    style Endpoints fill:#f59e0b,color:#000
    style Validators fill:#f59e0b,color:#000
    style Auth fill:#10b981,color:#fff
    style DB fill:#10b981,color:#fff
```

#### 4.1.1 Presentation Layer

The presentation layer handles all user interface concerns using Svelte 5's reactive paradigm.

| Component             | File Location                | Responsibility                                 |
| --------------------- | ---------------------------- | ---------------------------------------------- |
| **Route Handlers**    | `src/routes/`                | SvelteKit routing and page composition         |
| **Page Components**   | `src/routes/**/+page.svelte` | Full page layouts for each route               |
| **UI Components**     | `src/lib/components/ui/`     | Reusable interface elements from shadcn-svelte |
| **Layout Components** | `src/lib/components/layout/` | Navigation, headers, sidebars                  |

#### 4.1.2 Editor Layer

The editor layer provides rich Markdown editing capabilities built on Tiptap (ProseMirror).

| Component                   | Purpose                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| **Tiptap Editor**           | Core rich-text editing engine with real-time collaboration support  |
| **Collaboration Extension** | Integrates Yjs for multi-user editing                               |
| **Cursor Extension**        | Displays remote user cursors with name labels                       |
| **Markdown Rendering**      | Converts Markdown to HTML with syntax highlighting and math support |

#### 4.1.3 Collaboration Layer

The collaboration layer manages all real-time synchronization using Yjs CRDTs.

| Component               | Purpose                                                                           |
| ----------------------- | --------------------------------------------------------------------------------- |
| **Yjs Document**        | In-memory CRDT document that tracks all changes                                   |
| **Hocuspocus Provider** | WebSocket client managing server connection, reconnection, and sync               |
| **Awareness Protocol**  | Broadcasts and receives user presence (cursor position, selection, online status) |

#### 4.1.4 API Layer

The API layer provides RESTful endpoints for all CRUD operations.

| Endpoint Group    | Base Path                           | Operations                             |
| ----------------- | ----------------------------------- | -------------------------------------- |
| **Documents**     | `/api/documents`                    | Create, read, update, delete documents |
| **Sharing**       | `/api/documents/[id]/share`         | Generate/revoke share tokens           |
| **Collaborators** | `/api/documents/[id]/collaborators` | Manage document permissions            |
| **Versions**      | `/api/documents/[id]/versions`      | Version history operations             |
| **User**          | `/api/user`                         | User profile and settings              |
| **Auth**          | `/api/auth`                         | Session validation                     |

#### 4.1.5 Server Layer

The server layer handles authentication and database operations.

| Component       | Purpose                                                     |
| --------------- | ----------------------------------------------------------- |
| **Lucia Auth**  | Session-based authentication with GitHub OAuth provider     |
| **Drizzle ORM** | Type-safe database queries with automatic migration support |

### 4.2 Sync Server Components

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart TB
    subgraph Core["Server Core"]
        HP["Hocuspocus Server<br/>━━━━━━━━━━<br/>WebSocket handling<br/>Document management"]
    end

    subgraph Extensions["Extension Layer"]
        AuthExt["Authentication Extension<br/>━━━━━━━━━━<br/>Session validation<br/>Permission checking"]
        DBExt["Database Extension<br/>━━━━━━━━━━<br/>State persistence<br/>Debounced writes"]
    end

    subgraph Utils["Utility Layer"]
        RateLimit["Rate Limiter<br/>━━━━━━━━━━<br/>Per-IP limits<br/>Per-document limits"]
        ConnMgr["Connection Manager<br/>━━━━━━━━━━<br/>Connection tracking<br/>Cleanup handling"]
    end

    Clients["WebSocket Clients"]
    WebApp["Web Application"]
    Database[("PostgreSQL")]

    Clients <-->|"WebSocket"| HP
    HP --> AuthExt
    HP --> DBExt
    AuthExt -->|"HTTP"| WebApp
    DBExt -->|"SQL"| Database
    HP --> RateLimit
    RateLimit --> ConnMgr

    style HP fill:#2563eb,color:#fff
    style AuthExt fill:#8b5cf6,color:#fff
    style DBExt fill:#8b5cf6,color:#fff
    style RateLimit fill:#f59e0b,color:#000
    style ConnMgr fill:#f59e0b,color:#000
    style Clients fill:#1e40af,color:#fff
    style WebApp fill:#6b7280,color:#fff
    style Database fill:#059669,color:#fff
```

#### 4.2.1 Extension Details

| Extension                | Configuration                                                              | Behavior                                                          |
| ------------------------ | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Authentication**       | Validates session cookie via web app `/api/documents/[id]/access` endpoint | Rejects connections without valid session or document permission  |
| **Database Persistence** | Debounce: 2-10 seconds                                                     | Stores Yjs binary state as base64 in `documents.yjs_state` column |
| **Rate Limiting**        | 10 connections/IP, 50 connections/document                                 | Prevents abuse and ensures fair resource allocation               |

---

## 5. Data Architecture

### 5.1 Entity Relationship Diagram

```mermaid
%%{init: {'theme': 'neutral'}}%%
erDiagram
    users ||--o{ sessions : "authenticates via"
    users ||--o{ documents : "owns"
    users ||--o| user_settings : "configures"
    users ||--o{ document_collaborators : "collaborates on"
    documents ||--o{ document_collaborators : "shared with"
    documents ||--o{ document_versions : "has history"
    users ||--o{ document_versions : "creates"

    users {
        text id PK "UUID primary key"
        text github_id UK "GitHub user ID"
        text username "GitHub username"
        text email "Optional email"
        text avatar_url "Profile picture URL"
        timestamp created_at "Account creation"
        timestamp updated_at "Last profile update"
    }

    sessions {
        text id PK "Session token"
        text user_id FK "References users.id"
        timestamp expires_at "Session expiry"
    }

    user_settings {
        text user_id PK, FK "References users.id"
        text theme "light|dark|system"
        int font_size "12-24"
        text font_family "mono|jetbrains|fira|source"
        int tab_size "2|4"
        boolean line_wrapping "Word wrap enabled"
        int auto_save_interval "10-300 seconds"
        boolean spell_check "Spell check enabled"
        boolean show_line_numbers "Line numbers visible"
        timestamp updated_at "Last settings change"
    }

    documents {
        text id PK "UUID primary key"
        text title "Document title"
        text owner_id FK "References users.id"
        text yjs_state "Base64 encoded Yjs state"
        boolean is_public "Publicly visible"
        text share_token UK "Shareable link token"
        text gist_id "GitHub Gist ID"
        text gist_url "GitHub Gist URL"
        timestamp created_at "Document creation"
        timestamp updated_at "Last modification"
    }

    document_collaborators {
        text document_id PK, FK "References documents.id"
        text user_id PK, FK "References users.id"
        text permission "view|edit"
    }

    document_versions {
        text id PK "Version UUID"
        text document_id FK "References documents.id"
        text yjs_snapshot "Base64 encoded snapshot"
        text label "Optional version label"
        text created_by FK "References users.id"
        timestamp created_at "Snapshot timestamp"
    }
```

### 5.2 Table Descriptions

| Table                      | Purpose                                         | Key Relationships                                                       |
| -------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| **users**                  | Stores user accounts created via GitHub OAuth   | One-to-many with documents, sessions, settings                          |
| **sessions**               | Active authentication sessions managed by Lucia | Many-to-one with users                                                  |
| **user_settings**          | Editor preferences per user                     | One-to-one with users                                                   |
| **documents**              | Document metadata and Yjs binary state          | Many-to-one with users (owner), one-to-many with collaborators/versions |
| **document_collaborators** | Sharing permissions for each document           | Junction table between documents and users                              |
| **document_versions**      | Historical snapshots for version history        | Many-to-one with documents and users                                    |

### 5.3 Yjs State Storage

The document content is stored as a serialized Yjs document in the `yjs_state` column:

1. **Encoding**: Yjs `encodeStateAsUpdate()` produces a `Uint8Array`
2. **Storage**: The binary is base64-encoded and stored as text
3. **Retrieval**: On load, the base64 is decoded and applied via `applyUpdate()`
4. **Size**: Typical documents are 1-100KB; maximum supported is 10MB

---

## 6. Real-time Collaboration Architecture

### 6.1 CRDT-based Synchronization

MarkWrite uses **Yjs**, a high-performance CRDT implementation, to enable conflict-free collaborative editing.

```mermaid
%%{init: {'theme': 'neutral'}}%%
sequenceDiagram
    participant A as User A (Browser)
    participant YA as Yjs Doc A
    participant HP as Hocuspocus Server
    participant YB as Yjs Doc B
    participant B as User B (Browser)

    Note over A,B: Both users have document open

    A->>YA: Type "Hello"
    activate YA
    YA->>YA: Generate Yjs update
    YA->>HP: Send update via WebSocket
    deactivate YA

    activate HP
    HP->>HP: Merge into server state
    HP->>YB: Broadcast update
    deactivate HP

    activate YB
    YB->>YB: Apply update (CRDT merge)
    YB->>B: Render updated content
    deactivate YB

    Note over A,B: Simultaneous edit (conflict scenario)

    par User A types
        A->>YA: Type "World" at position 5
        YA->>HP: Send update
    and User B types
        B->>YB: Type "!" at position 5
        YB->>HP: Send update
    end

    HP->>HP: CRDT automatically merges<br/>(deterministic ordering)
    HP->>YA: Broadcast merged state
    HP->>YB: Broadcast merged state

    Note over A,B: Both users see "Hello World!" or "Hello! World"<br/>(consistent across all clients)
```

### 6.2 Why CRDT?

| Challenge            | Traditional Approach              | CRDT Approach                               |
| -------------------- | --------------------------------- | ------------------------------------------- |
| **Concurrent edits** | Lock document or manual merge     | Automatic merge with guaranteed consistency |
| **Network latency**  | Delayed sync, potential conflicts | Local-first, sync when possible             |
| **Offline editing**  | Disabled or queued                | Full editing, merge on reconnect            |
| **Consistency**      | Eventual (may diverge)            | Strong eventual consistency guaranteed      |

### 6.3 Presence Awareness

The awareness protocol broadcasts user state to all connected clients:

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart LR
    subgraph UserA["User A's Awareness State"]
        A1["user: {id, name, color}"]
        A2["cursor: {anchor: 42, head: 42}"]
        A3["selection: null"]
    end

    subgraph Broadcast["Awareness Broadcast"]
        HP["Hocuspocus Server"]
    end

    subgraph UserB["User B's View"]
        B1["Remote cursor at position 42"]
        B2["Label: 'User A'"]
        B3["Color: #958DF1"]
    end

    UserA -->|"Awareness update"| HP
    HP -->|"Broadcast to others"| UserB

    style HP fill:#2563eb,color:#fff
```

**Awareness Data Structure:**

```typescript
interface UserPresence {
  id: string; // User ID
  name: string; // Display name
  color: string; // Cursor color (deterministic from ID)
  avatar?: string; // Avatar URL
}

interface CursorState {
  user: UserPresence;
  anchor: number; // Selection start
  head: number; // Selection end (cursor position)
}
```

### 6.4 Persistence Strategy

Document state is persisted using a debounced write strategy:

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart TB
    subgraph Editing["Client Editing"]
        Edit1["Edit 1"]
        Edit2["Edit 2"]
        Edit3["Edit 3"]
    end

    subgraph Debounce["Debounce Window"]
        Timer["2-10 second window"]
    end

    subgraph Persist["Persistence"]
        Encode["Encode Yjs state"]
        Write["Write to PostgreSQL"]
    end

    Edit1 --> Timer
    Edit2 --> Timer
    Edit3 --> Timer
    Timer -->|"After debounce period"| Encode
    Encode --> Write

    style Timer fill:#f59e0b,color:#000
    style Write fill:#059669,color:#fff
```

**Configuration:**
| Parameter | Value | Purpose |
|-----------|-------|---------|
| `DEBOUNCE_MS` | 2000ms | Minimum time before persisting |
| `MAX_DEBOUNCE_MS` | 10000ms | Maximum time before forcing persist |

---

## 7. Security Architecture

### 7.1 Authentication Flow

```mermaid
%%{init: {'theme': 'neutral'}}%%
sequenceDiagram
    participant User
    participant Web as Web Application
    participant GH as GitHub OAuth
    participant DB as PostgreSQL

    User->>Web: Click "Sign in with GitHub"
    Web->>Web: Generate OAuth state
    Web->>GH: Redirect to /authorize

    GH->>User: Display authorization page
    User->>GH: Approve access
    GH->>Web: Redirect with code + state

    Web->>Web: Validate state parameter
    Web->>GH: POST /access_token (code)
    GH->>Web: Return access_token

    Web->>GH: GET /user (access_token)
    GH->>Web: Return user profile

    Web->>DB: Upsert user record
    Web->>DB: Create session
    Web->>User: Set session cookie (httpOnly, secure)

    Note over User,DB: User is now authenticated
```

### 7.2 Authorization Model

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart TB
    subgraph Request["Incoming Request"]
        Req["Document Access Request"]
    end

    subgraph Auth["Authorization Check"]
        IsOwner{"Is Owner?"}
        IsCollab{"Is Collaborator?"}
        IsPublic{"Is Public?"}
        HasToken{"Has Share Token?"}
    end

    subgraph Permission["Permission Level"]
        Full["Full Access<br/>(read, write, delete, share)"]
        Edit["Edit Access<br/>(read, write)"]
        View["View Access<br/>(read only)"]
        Deny["Access Denied"]
    end

    Req --> IsOwner
    IsOwner -->|Yes| Full
    IsOwner -->|No| IsCollab
    IsCollab -->|Edit permission| Edit
    IsCollab -->|View permission| View
    IsCollab -->|No| IsPublic
    IsPublic -->|Yes| View
    IsPublic -->|No| HasToken
    HasToken -->|Valid token| View
    HasToken -->|No/Invalid| Deny

    style Full fill:#059669,color:#fff
    style Edit fill:#2563eb,color:#fff
    style View fill:#6b7280,color:#fff
    style Deny fill:#dc2626,color:#fff
```

### 7.3 Security Measures

| Layer                | Measure              | Implementation                          |
| -------------------- | -------------------- | --------------------------------------- |
| **Transport**        | TLS encryption       | HTTPS for web, WSS for WebSocket        |
| **Authentication**   | Session-based auth   | Lucia with httpOnly, secure cookies     |
| **Authorization**    | Permission checks    | Server-side validation on every request |
| **Rate Limiting**    | Connection limits    | 10/IP, 50/document on sync server       |
| **Input Validation** | Schema validation    | Zod schemas on all API endpoints        |
| **XSS Prevention**   | Content sanitization | DOMPurify for rendered Markdown         |
| **CSRF Protection**  | SameSite cookies     | Strict cookie policy                    |

---

## 8. Deployment Architecture

### 8.1 Production Topology

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart TB
    subgraph Internet["Internet"]
        Users["Users"]
    end

    subgraph CDN["Vercel Edge Network"]
        Edge["Edge Nodes<br/>━━━━━━━━━━<br/>Global distribution<br/>Static asset caching"]
    end

    subgraph Vercel["Vercel Platform"]
        Serverless["Serverless Functions<br/>━━━━━━━━━━<br/>SvelteKit API routes<br/>Server-side rendering"]
    end

    subgraph Railway["Railway Platform"]
        Container["Docker Container<br/>━━━━━━━━━━<br/>Hocuspocus Server<br/>Persistent process"]
    end

    subgraph Database["Database Layer"]
        PG["PostgreSQL<br/>━━━━━━━━━━<br/>Railway managed<br/>or Neon serverless"]
    end

    Users -->|"HTTPS"| Edge
    Edge -->|"Static assets"| Users
    Edge -->|"Dynamic requests"| Serverless
    Users -->|"WSS"| Container
    Serverless -->|"SQL"| PG
    Container -->|"SQL"| PG

    style Users fill:#1e40af,color:#fff
    style Edge fill:#f59e0b,color:#000
    style Serverless fill:#2563eb,color:#fff
    style Container fill:#8b5cf6,color:#fff
    style PG fill:#059669,color:#fff
```

### 8.2 Deployment Targets

| Component           | Platform        | Reason                                                        |
| ------------------- | --------------- | ------------------------------------------------------------- |
| **Web Application** | Vercel          | Optimized for SvelteKit, global edge network, automatic HTTPS |
| **Sync Server**     | Railway         | Supports persistent WebSocket connections, Docker containers  |
| **Database**        | Railway or Neon | Managed PostgreSQL with connection pooling                    |

### 8.3 Scaling Considerations

| Component           | Scaling Strategy                                                             |
| ------------------- | ---------------------------------------------------------------------------- |
| **Web Application** | Horizontal (Vercel automatically scales serverless functions)                |
| **Sync Server**     | Vertical (single instance per deployment); horizontal requires Redis adapter |
| **Database**        | Vertical (managed scaling) with connection pooling                           |

---

## 9. Technology Decisions

### 9.1 Decision Records

#### 9.1.1 Yjs for CRDT

| Aspect         | Decision                                                                        |
| -------------- | ------------------------------------------------------------------------------- |
| **Choice**     | Yjs over Automerge, ShareDB                                                     |
| **Rationale**  | Best performance benchmarks, mature ProseMirror integration, active maintenance |
| **Trade-offs** | Binary protocol (harder to debug), requires specialized server                  |

#### 9.1.2 Hocuspocus for WebSocket

| Aspect         | Decision                                                                     |
| -------------- | ---------------------------------------------------------------------------- |
| **Choice**     | Hocuspocus over custom WebSocket server                                      |
| **Rationale**  | Purpose-built for Yjs, built-in persistence extensions, authentication hooks |
| **Trade-offs** | Less flexibility than custom server, tied to Tiptap ecosystem                |

#### 9.1.3 SvelteKit for Frontend

| Aspect         | Decision                                                                      |
| -------------- | ----------------------------------------------------------------------------- |
| **Choice**     | SvelteKit over Next.js, Remix                                                 |
| **Rationale**  | Excellent DX, smaller bundle size, native TypeScript support, unified routing |
| **Trade-offs** | Smaller ecosystem than React, fewer component libraries                       |

#### 9.1.4 Drizzle for ORM

| Aspect         | Decision                                                                |
| -------------- | ----------------------------------------------------------------------- |
| **Choice**     | Drizzle over Prisma, TypeORM                                            |
| **Rationale**  | Full TypeScript inference, minimal runtime overhead, SQL-like query API |
| **Trade-offs** | Newer project, fewer migration features than Prisma                     |

#### 9.1.5 Lucia for Authentication

| Aspect         | Decision                                                               |
| -------------- | ---------------------------------------------------------------------- |
| **Choice**     | Lucia over Auth.js, custom JWT                                         |
| **Rationale**  | Lightweight, session-based (better for SSR), excellent Drizzle adapter |
| **Trade-offs** | Less feature-rich than Auth.js, manual OAuth setup                     |

---

## References

- [C4 Model](https://c4model.com/) - Architecture visualization methodology
- [Yjs Documentation](https://docs.yjs.dev/) - CRDT implementation
- [Hocuspocus Documentation](https://tiptap.dev/hocuspocus) - WebSocket server
- [SvelteKit Documentation](https://kit.svelte.dev/) - Web framework
- [Drizzle ORM Documentation](https://orm.drizzle.team/) - Database ORM
- [Lucia Documentation](https://lucia-auth.com/) - Authentication library
