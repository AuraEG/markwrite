<div align="center">

<img src="logo.png" alt="MarkWrite Logo" width="200" />

# MarkWrite

### Real-time Collaborative Markdown Editor

[![CI](https://github.com/AuraEG/markwrite/actions/workflows/ci.yml/badge.svg)](https://github.com/AuraEG/markwrite/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/AuraEG/markwrite/branch/main/graph/badge.svg)](https://codecov.io/gh/AuraEG/markwrite)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x-FF3E00?logo=svelte)](https://kit.svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![AuraEG](https://img.shields.io/badge/Org-AuraEG-blueviolet)](https://github.com/AuraEG)

**Write together. Sync seamlessly. No conflicts.**

[Live Demo](#) | [Documentation](docs/) | [Report Bug](https://github.com/AuraEG/markwrite/issues/new?template=bug-report.md) | [Request Feature](https://github.com/AuraEG/markwrite/issues/new?template=feature-request.md)

</div>

---

## Overview

MarkWrite is a professional, web-based Markdown editor that enables real-time collaboration without conflicts. Built on CRDT (Conflict-free Replicated Data Type) technology, it allows multiple users to edit the same document simultaneously with automatic conflict resolution and offline support.

### Key Features

| Feature                     | Description                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------ |
| **Real-time Collaboration** | Multiple users edit simultaneously with live cursor positions and presence awareness |
| **Conflict-free Sync**      | Powered by Yjs CRDTs - edits merge automatically, even offline                       |
| **Markdown Native**         | Full CommonMark + GFM support with live preview                                      |
| **Syntax Highlighting**     | Code blocks with multi-language syntax highlighting                                  |
| **Math Support**            | KaTeX-powered LaTeX math rendering                                                   |
| **Document Sharing**        | Granular permissions (view/edit) with shareable links                                |
| **Version History**         | Browse and restore previous document versions                                        |
| **GitHub Gist Export**      | Share documents publicly via GitHub Gists                                            |
| **Dark Mode**               | Light, dark, and system-preference themes                                            |
| **User Settings**           | Customizable editor preferences (font, theme, etc.)                                  |

---

## Tech Stack

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart LR
    subgraph Frontend
        A[SvelteKit 2] --> B[Svelte 5]
        B --> C[Tailwind CSS]
        B --> D[shadcn-svelte]
        B --> E[Tiptap Editor]
    end

    subgraph Sync
        F[Yjs CRDT] --> G[y-prosemirror]
        G --> H[Hocuspocus]
    end

    subgraph Backend
        I[PostgreSQL 16] --> J[Drizzle ORM]
        K[Lucia Auth] --> L[GitHub OAuth]
    end

    Frontend --> Sync
    Sync --> Backend
```

| Layer              | Technology                                      |
| ------------------ | ----------------------------------------------- |
| **Frontend**       | SvelteKit 2, Svelte 5, TypeScript 5             |
| **Styling**        | Tailwind CSS 4, shadcn-svelte, tw-animate-css   |
| **Editor**         | Tiptap (ProseMirror-based), CodeMirror 6        |
| **Sync Engine**    | Yjs (CRDT), y-prosemirror, Hocuspocus           |
| **Database**       | PostgreSQL 16, Drizzle ORM                      |
| **Authentication** | Lucia v3, Arctic (GitHub OAuth)                 |
| **Markdown**       | marked, highlight.js, KaTeX                     |
| **Build**          | Vite, Turbo (monorepo)                          |
| **Hosting**        | Vercel (web), Hugging Face Spaces (sync server) |
| **CI/CD**          | GitHub Actions, Codecov                         |

---

## Architecture

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart TB
    subgraph Client ["Client (Browser)"]
        UI[SvelteKit App]
        Editor[Tiptap Editor]
        YDoc[Yjs Document]
        Provider[Hocuspocus Provider]
    end

    subgraph SyncServer ["Sync Server"]
        HP[Hocuspocus Server]
        Auth[Auth Extension]
        Persist[Database Extension]
    end

    subgraph Database ["PostgreSQL"]
        Users[(users)]
        Docs[(documents)]
        Versions[(document_versions)]
        Collabs[(document_collaborators)]
    end

    UI --> Editor
    Editor --> YDoc
    YDoc <-->|WebSocket| Provider
    Provider <-->|WebSocket| HP
    HP --> Auth
    HP --> Persist
    Persist --> Docs
    Auth --> Users

    UI -->|REST API| Docs
    UI -->|REST API| Versions
    UI -->|REST API| Collabs
```

> See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed C4 diagrams and component descriptions.

---

## Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **PostgreSQL** 16 (or Docker)
- **GitHub OAuth App** ([Create one here](https://github.com/settings/developers))

### Quick Start

```bash
# Clone the repository
git clone https://github.com/AuraEG/markwrite.git
cd markwrite

# Install dependencies
pnpm install

# Configure environment
cp apps/web/.env.example apps/web/.env
cp apps/sync-server/.env.example apps/sync-server/.env
# Edit .env files with your database URL and GitHub OAuth credentials

# Initialize database
pnpm --filter web db:push

# Start development servers
pnpm dev
```

The web app runs at `http://localhost:5173` and the sync server at `ws://localhost:1234`.

### Environment Variables

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete environment configuration.

**Web App** (`apps/web/.env`):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/markwrite"
GITHUB_CLIENT_ID="your_client_id"
GITHUB_CLIENT_SECRET="your_client_secret"
PUBLIC_APP_URL="http://localhost:5173"
PUBLIC_SYNC_SERVER_URL="ws://localhost:1234"
```

**Sync Server** (`apps/sync-server/.env`):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/markwrite"
PORT=1234
WEB_APP_URL="http://localhost:5173"
CORS_ORIGINS="http://localhost:5173"
```

---

## Available Scripts

| Command                       | Description                        |
| ----------------------------- | ---------------------------------- |
| `pnpm dev`                    | Start all development servers      |
| `pnpm build`                  | Build all packages for production  |
| `pnpm test`                   | Run all tests                      |
| `pnpm lint`                   | Run ESLint on all packages         |
| `pnpm format`                 | Format code with Prettier          |
| `pnpm format:check`           | Check code formatting              |
| `pnpm typecheck`              | Run TypeScript type checking       |
| `pnpm --filter web db:push`   | Push schema changes to database    |
| `pnpm --filter web db:studio` | Open Drizzle Studio (database GUI) |

---

## Documentation

| Document                               | Description                           |
| -------------------------------------- | ------------------------------------- |
| [Architecture](docs/ARCHITECTURE.md)   | System design, C4 diagrams, data flow |
| [API Reference](docs/API.md)           | REST API endpoints and examples       |
| [Deployment Guide](docs/DEPLOYMENT.md) | Production deployment instructions    |
| [Contributing](CONTRIBUTING.md)        | How to contribute to the project      |
| [Changelog](CHANGELOG.md)              | Version history and release notes     |

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development setup
- Code style guidelines
- Git workflow
- Pull request process

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with precision by [AuraEG](https://github.com/AuraEG)**

</div>
