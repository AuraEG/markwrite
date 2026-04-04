# Changelog

All notable changes to MarkWrite will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Project documentation (README, API docs, architecture, contributing guide)

---

## [0.1.0] - 2026-04-04

### Added

#### Authentication

- GitHub OAuth integration using Lucia v3
- Session-based authentication with secure cookies
- Automatic user profile creation from GitHub data

#### Document Management

- Create, read, update, delete documents
- Document list with pagination
- Document title editing
- Soft delete with recovery support

#### Real-time Collaboration

- Yjs CRDT-based document synchronization
- Hocuspocus WebSocket server for multi-user editing
- Conflict-free concurrent editing
- Offline editing with automatic sync on reconnection

#### Presence Awareness

- Live cursor positions for all collaborators
- User name labels on remote cursors
- Color-coded cursors (deterministic based on user ID)
- Online/offline status indicators

#### Document Sharing

- Shareable link generation
- Permission levels: view and edit
- Collaborator management (add/remove users)
- Public document option for anonymous viewing

#### Document Export

- Download as Markdown (.md)
- Download as HTML
- GitHub Gist integration for public sharing

#### Version History

- Automatic version snapshots (every 5 minutes during editing)
- Manual version creation with labels
- Version preview and comparison
- Restore to previous versions
- Maximum 50 versions per document (auto-pruning)

#### Editor Features

- Full Markdown support (CommonMark + GFM)
- Live preview rendering
- Syntax highlighting for code blocks (40+ languages)
- KaTeX math rendering (inline and block)
- Keyboard shortcuts for formatting
- Table support

#### Dark Mode

- Light, dark, and system-preference themes
- Persistent theme selection
- Smooth theme transitions

#### User Settings

- Theme preference
- Font size (12-24px)
- Font family selection (mono, JetBrains Mono, Fira Code, Source Code Pro)
- Tab size (2 or 4 spaces)
- Line wrapping toggle
- Auto-save interval configuration
- Spell check toggle
- Line numbers toggle

#### Infrastructure

- Turborepo monorepo structure
- SvelteKit 2 with Svelte 5
- TypeScript 5 throughout
- PostgreSQL 16 with Drizzle ORM
- Tailwind CSS 4 with shadcn-svelte components
- GitHub Actions CI/CD pipeline
- Codecov integration for coverage reporting

### Security

- HTTPS/WSS encryption in production
- HttpOnly secure session cookies
- Server-side authorization on all endpoints
- Rate limiting on sync server (10 connections/IP, 50/document)
- Input validation with Zod schemas
- XSS prevention with DOMPurify

---

## Version History Summary

| Version | Date       | Highlights                             |
| ------- | ---------- | -------------------------------------- |
| 0.1.0   | 2026-04-04 | Initial release with full MVP features |

---

## Migration Notes

### Upgrading to 0.1.0

This is the initial release. No migration required.

---

## Links

- [Repository](https://github.com/AuraEG/markwrite)
- [Issues](https://github.com/AuraEG/markwrite/issues)
- [Pull Requests](https://github.com/AuraEG/markwrite/pulls)

[Unreleased]: https://github.com/AuraEG/markwrite/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/AuraEG/markwrite/releases/tag/v0.1.0
