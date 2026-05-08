# Changelog

All notable changes to MarkWrite will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned for v1.1

- Mobile device optimization
- Additional OAuth providers (Google, GitLab)
- Document templates
- Export to PDF
- Collaborative cursors with user names
- Document search and filtering
- Keyboard shortcuts customization

---

## [1.0.0] - 2026-05-08

### Added

- **End-to-End Testing**: Comprehensive Playwright test suite with 21 tests across Chromium, Firefox, and WebKit
- **Document Compression**: Automatic gzip compression for large documents (>50KB) to handle SvelteKit body size limits
- **Enhanced Error Handling**: Better error messages and logging for document sync operations

### Fixed

- **SSR Hydration Warnings**: Fixed nested button elements in tooltips using `asChild` prop
- **Large Document Sync**: Network errors when saving documents >512KB now resolved with compression
- **Content Loss**: Fixed content disappearing during real-time collaboration by properly handling Yjs state merging
- **Editor Updates**: Remote changes now properly update the CodeMirror editor view
- **Unused Variable**: Removed unused `currentState` variable in EditorPanel

### Changed

- **Environment Variables**: Updated sync server URL to use `PUBLIC_SYNC_SERVER_URL` (SvelteKit convention)
- **Body Size Limits**: Increased to 10MB for Node adapter, 5MB validation in API
- **Compression Threshold**: Set to 50KB to ensure documents stay well below 512KB limit

### Technical

- Added `pako` library for gzip compression/decompression
- Enhanced `setContent` method in MarkdownEditor for remote updates
- Improved Hocuspocus provider with better reconnection settings and logging
- Added Playwright test scripts: `test:e2e`, `test:e2e:ui`, `test:e2e:headed`, `test:e2e:report`

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
| 1.0.0   | 2026-05-08 | E2E testing, compression, bug fixes    |
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

[Unreleased]: https://github.com/AuraEG/markwrite/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/AuraEG/markwrite/releases/tag/v1.0.0
[0.1.0]: https://github.com/AuraEG/markwrite/releases/tag/v0.1.0
