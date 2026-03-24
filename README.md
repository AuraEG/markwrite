<div align="center">

# MarkWrite

### Collaborative Markdown Editor with Real-time Sync

[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x-FF3E00?logo=svelte)](https://kit.svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![AuraEG](https://img.shields.io/badge/Org-AuraEG-blueviolet)](https://github.com/AuraEG)

**A professional, real-time collaborative Markdown writing environment.**
Write together. Sync seamlessly. No conflicts.

---

</div>

## Overview

MarkWrite addresses the common pain point of disjointed documentation workflows and conflicting edits when using traditional file-based or less responsive online editors. It delivers a seamless "live-editing" experience, handling complex state synchronization across multiple users and devices elegantly using CRDT technology.

## Features

- **Real-time Collaboration** -- Multiple users can edit the same document simultaneously with live cursor positions and presence awareness.
- **Conflict-free Sync** -- Built on Yjs CRDTs, edits merge automatically without conflicts, even offline.
- **Markdown Native** -- Full Markdown support with live preview and syntax highlighting.
- **Document Management** -- Create, organize, and share documents with granular permissions.
- **Version History** -- Browse and restore previous versions of any document.
- **Dark Mode** -- Light and dark themes with system preference detection.

## Tech Stack

| Layer           | Technology                              |
|-----------------|-----------------------------------------|
| Frontend        | SvelteKit 2, Svelte 5, TypeScript       |
| Styling         | Tailwind CSS, shadcn-svelte             |
| Editor          | Tiptap (ProseMirror-based)              |
| Sync Engine     | Yjs (CRDT) + y-prosemirror              |
| WebSocket       | Hocuspocus                              |
| Database        | PostgreSQL 16 + Drizzle ORM             |
| Auth            | Lucia (GitHub OAuth)                    |
| Hosting         | Vercel + Railway                        |

## Architecture

```
+------------------+       WebSocket        +------------------+
|   SvelteKit App  | <------------------->  |   Hocuspocus     |
|   (Tiptap + Yjs) |                        |   (Sync Server)  |
+--------+---------+                        +--------+---------+
         |                                           |
         | REST API                                  | SQL
         v                                           v
+------------------+                        +------------------+
|   API Routes     | ---------------------> |   PostgreSQL     |
|   (Drizzle)      |          SQL           |   (Documents)    |
+------------------+                        +------------------+
```

> See [C4 Architecture Diagrams](docs/diagrams/) for detailed views.

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- PostgreSQL 16 (or Docker)

### Installation

```bash
# Clone the repository
git clone https://github.com/AuraEG/markwrite.git
cd markwrite

# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env
cp apps/sync-server/.env.example apps/sync-server/.env
# Edit .env files with your configuration

# Run database migrations
pnpm --filter web db:push

# Start development servers
pnpm dev
```

The web app runs at `http://localhost:5173` and the sync server at `ws://localhost:1234`.

## Project Structure

```
markwrite/
├── apps/
│   ├── web/              # SvelteKit frontend
│   └── sync-server/      # Hocuspocus WebSocket server
├── packages/
│   └── shared/           # Shared types and constants
├── docs/
│   ├── project-spec.md   # Full specification
│   ├── diagrams/         # C4 architecture diagrams
│   └── sprints/          # Sprint completion records
└── .github/              # CI/CD workflows
```

## Documentation

- [Project Specification](docs/project-spec.md)
- [Global Development Instructions](https://github.com/AuraEG/AuraEG/blob/main/docs/global-instructions.md)
- [Project Management Flow](https://github.com/AuraEG/AuraEG/blob/main/docs/project-management-flow.md)
- [Code Review Guide](https://github.com/AuraEG/AuraEG/blob/main/docs/code-review-guide.md)

## Team

| Role       | Member |
|------------|--------|
| Developer  | TBD    |
| Reviewer   | TBD    |

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with precision by [AuraEG](https://github.com/AuraEG)**

</div>
