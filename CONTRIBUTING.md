# Contributing to MarkWrite

Thank you for your interest in contributing to MarkWrite! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Development Workflow](#development-workflow)
5. [Code Style Guide](#code-style-guide)
6. [Git Workflow](#git-workflow)
7. [Pull Request Process](#pull-request-process)
8. [Testing Requirements](#testing-requirements)
9. [Documentation](#documentation)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. We expect all contributors to:

- Be respectful of differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the project and community
- Show empathy towards other contributors

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **PostgreSQL** 16 (or Docker for local database)
- **Git** configured with your GitHub account
- A code editor (VS Code recommended)

### Recommended VS Code Extensions

| Extension                 | Purpose                    |
| ------------------------- | -------------------------- |
| Svelte for VS Code        | Svelte syntax highlighting |
| ESLint                    | Linting integration        |
| Prettier                  | Code formatting            |
| Tailwind CSS IntelliSense | Tailwind autocomplete      |
| Error Lens                | Inline error display       |

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/markwrite.git
cd markwrite

# Add upstream remote
git remote add upstream https://github.com/AuraEG/markwrite.git
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

```bash
# Copy example environment files
cp apps/web/.env.example apps/web/.env
cp apps/sync-server/.env.example apps/sync-server/.env
```

Edit the `.env` files with your local configuration:

**apps/web/.env:**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/markwrite"
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
PUBLIC_APP_URL="http://localhost:5173"
PUBLIC_SYNC_SERVER_URL="ws://localhost:1234"
VITE_SYNC_SERVER_URL="ws://localhost:1234"
```

**apps/sync-server/.env:**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/markwrite"
PORT=1234
CORS_ORIGINS="http://localhost:5173"
WEB_APP_URL="http://localhost:5173"
```

### 4. Set Up Database

```bash
# Start PostgreSQL (using Docker)
docker run --name markwrite-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:16

# Create database
docker exec -it markwrite-db psql -U postgres -c "CREATE DATABASE markwrite;"

# Run migrations
pnpm --filter web db:push
```

### 5. Start Development Servers

```bash
# Start all services (web + sync server)
pnpm dev
```

The application will be available at:

- Web app: `http://localhost:5173`
- Sync server: `ws://localhost:1234`

---

## Development Workflow

### Available Scripts

| Command                       | Description                       |
| ----------------------------- | --------------------------------- |
| `pnpm dev`                    | Start all development servers     |
| `pnpm build`                  | Build all packages for production |
| `pnpm test`                   | Run all tests                     |
| `pnpm lint`                   | Run ESLint                        |
| `pnpm format`                 | Format code with Prettier         |
| `pnpm format:check`           | Check formatting without changes  |
| `pnpm typecheck`              | Run TypeScript type checking      |
| `pnpm --filter web db:studio` | Open Drizzle Studio               |

### Making Changes

1. **Create a feature branch** from `develop`
2. **Make your changes** following the code style guide
3. **Write tests** for new functionality
4. **Run linters and tests** before committing
5. **Submit a pull request** to `develop`

---

## Code Style Guide

### General Principles

- Write clear, readable code over clever code
- Follow existing patterns in the codebase
- Keep functions focused and small
- Use meaningful variable and function names

### TypeScript Guidelines

```typescript
// Use explicit types for function parameters and return values
function createDocument(title: string): Promise<Document> {
  // ...
}

// Use interfaces for object shapes
interface DocumentMetadata {
  id: string;
  title: string;
  createdAt: Date;
}

// Prefer const over let
const documentId = crypto.randomUUID();

// Use optional chaining
const username = user?.profile?.name ?? 'Anonymous';
```

### File Headers

All source files should include a header comment:

```typescript
// ==========================================================================
// File    : filename.ts
// Project : MarkWrite
// Layer   : [API | Server | Collaboration | Component | etc.]
// Purpose : Brief description of the file's purpose.
//
// Author  : AuraEG Team
// Created : YYYY-MM-DD
// ==========================================================================
```

### Section Comments

Use section comments to organize code within files:

```typescript
// --------------------------------------------------------------------------
// [SECTION] Section Name
// --------------------------------------------------------------------------

// Code for this section...
```

### Svelte Components

```svelte
<script lang="ts">
  // Imports first
  import { Button } from '$lib/components/ui/button';

  // Props
  interface Props {
    title: string;
    onSave?: () => void;
  }

  let { title, onSave }: Props = $props();

  // Local state
  let isLoading = $state(false);

  // Derived values
  const isEmpty = $derived(title.length === 0);

  // Functions
  function handleSubmit() {
    // ...
  }
</script>

<!-- Template -->
<div class="container">
  <h1>{title}</h1>
</div>

<!-- Styles (if needed, prefer Tailwind) -->
<style>
  .container {
    /* Only for styles that can't be done with Tailwind */
  }
</style>
```

### CSS / Tailwind

- Use Tailwind utility classes for styling
- Avoid custom CSS unless absolutely necessary
- Follow mobile-first responsive design
- Use CSS variables from the design system

```svelte
<!-- Good -->
<button class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2">
  Submit
</button>

<!-- Avoid -->
<button style="padding: 8px 16px; background: blue;"> Submit </button>
```

### Imports Organization

Order imports as follows:

```typescript
// 1. External packages
import { json, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

// 2. Internal modules (absolute paths)
import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';

// 3. Types
import type { RequestHandler } from './$types';
```

---

## Git Workflow

### Branch Naming

| Type          | Format                                        | Example                        |
| ------------- | --------------------------------------------- | ------------------------------ |
| Feature       | `feature/{issue-number}-{short-description}`  | `feature/42-document-export`   |
| Bug fix       | `fix/{issue-number}-{short-description}`      | `fix/55-auth-redirect-loop`    |
| Documentation | `docs/{issue-number}-{short-description}`     | `docs/29-api-reference`        |
| Refactor      | `refactor/{issue-number}-{short-description}` | `refactor/60-optimize-queries` |

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, no logic change |
| `refactor` | Code restructuring |
| `test` | Adding or updating tests |
| `chore` | Build, CI, tooling |
| `perf` | Performance improvement |

**Examples:**

```
feat(editor): add keyboard shortcuts for formatting

fix(auth): resolve session expiration redirect loop

docs(api): add version history endpoint documentation

refactor(db): optimize document list query
```

### Keeping Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Switch to develop branch
git checkout develop

# Merge upstream changes
git merge upstream/develop

# Push to your fork
git push origin develop
```

---

## Pull Request Process

### Before Submitting

Ensure the following checks pass:

```bash
# Run all checks
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

### PR Checklist

Your PR must include:

- [ ] Clear description of changes
- [ ] Link to related issue (use `Closes #N`)
- [ ] Type of change marked
- [ ] Tests for new functionality
- [ ] Documentation updates (if applicable)
- [ ] Screenshots for UI changes
- [ ] All CI checks passing

### PR Template

The repository includes a PR template. Fill it out completely:

1. **Description** - What does this PR do?
2. **Related Issue** - Link to the GitHub issue
3. **Type of Change** - Feature, fix, docs, etc.
4. **Changes Made** - Bullet list of changes
5. **How to Test** - Step-by-step testing instructions
6. **Screenshots** - For UI changes

### Review Process

1. Submit PR to `develop` branch
2. Wait for CI checks to pass
3. Request review from maintainers
4. Address feedback with additional commits
5. Squash and merge once approved

### After Merge

- Delete your feature branch
- Pull the latest `develop` to your fork
- Celebrate your contribution!

---

## Testing Requirements

### Test Structure

Tests are located in `__tests__` directories adjacent to the code they test:

```
apps/web/src/
├── lib/
│   └── utils/
│       ├── format.ts
│       └── __tests__/
│           └── format.test.ts
└── routes/
    └── api/
        └── documents/
            └── __tests__/
                └── documents.test.ts
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test -- --coverage

# Run tests in watch mode
pnpm --filter web test:watch

# Run specific test file
pnpm test -- format.test.ts
```

### Writing Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { formatDate } from '../format';

describe('formatDate', () => {
  it('formats ISO date to readable string', () => {
    const result = formatDate('2026-04-04T12:00:00Z');
    expect(result).toBe('April 4, 2026');
  });

  it('handles invalid date gracefully', () => {
    const result = formatDate('invalid');
    expect(result).toBe('Invalid date');
  });
});
```

### Coverage Requirements

- Aim for **70% or higher** code coverage
- All new features must include tests
- Bug fixes should include regression tests

---

## Documentation

### When to Update Docs

Update documentation when you:

- Add new features
- Change API endpoints
- Modify configuration options
- Update dependencies
- Change deployment process

### Documentation Files

| File                   | Purpose                             |
| ---------------------- | ----------------------------------- |
| `README.md`            | Project overview and quick start    |
| `CONTRIBUTING.md`      | This file - contribution guidelines |
| `CHANGELOG.md`         | Version history                     |
| `docs/ARCHITECTURE.md` | System architecture                 |
| `docs/API.md`          | API reference                       |
| `docs/DEPLOYMENT.md`   | Deployment guide                    |

### Writing Guidelines

- Use clear, concise language
- Include code examples where helpful
- Keep documentation up to date with code
- Use tables for structured information
- Include diagrams for complex concepts

---

## Getting Help

If you need help:

1. Check existing [issues](https://github.com/AuraEG/markwrite/issues) for similar questions
2. Review the [documentation](docs/)
3. Open a [new issue](https://github.com/AuraEG/markwrite/issues/new) with your question

---

## Recognition

Contributors are recognized in:

- The project README
- Release notes
- GitHub contributors page

Thank you for contributing to MarkWrite!
