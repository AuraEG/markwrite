// ==========================================================================
// File    : seed.ts
// Project : MarkWrite
// Layer   : Scripts
// Purpose : Database seed script for development and testing environments.
//
// Author  : AuraEG Team
// Created : 2026-03-25
// ==========================================================================

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { users, documents, documentCollaborators } from '../src/lib/server/db/schema';

// --------------------------------------------------------------------------
// [SECTION] Configuration
// --------------------------------------------------------------------------

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/markwrite';

const sql = postgres(DATABASE_URL);
const db = drizzle(sql);

// --------------------------------------------------------------------------
// [SECTION] Seed Data
// --------------------------------------------------------------------------

const SEED_USERS = [
  {
    id: 'seed-user-1',
    githubId: '12345678',
    username: 'demo_user',
    email: 'demo@markwrite.dev',
    avatarUrl: 'https://avatars.githubusercontent.com/u/12345678',
  },
  {
    id: 'seed-user-2',
    githubId: '87654321',
    username: 'test_collaborator',
    email: 'collab@markwrite.dev',
    avatarUrl: 'https://avatars.githubusercontent.com/u/87654321',
  },
];

const SEED_DOCUMENTS = [
  {
    id: 'seed-doc-1',
    title: 'Getting Started with MarkWrite',
    ownerId: 'seed-user-1',
    isPublic: true,
    yjsState: null,
  },
  {
    id: 'seed-doc-2',
    title: 'Project Ideas',
    ownerId: 'seed-user-1',
    isPublic: false,
    yjsState: null,
  },
  {
    id: 'seed-doc-3',
    title: 'Meeting Notes - Sprint Planning',
    ownerId: 'seed-user-1',
    isPublic: false,
    yjsState: null,
  },
  {
    id: 'seed-doc-4',
    title: 'Shared Document',
    ownerId: 'seed-user-2',
    isPublic: true,
    yjsState: null,
  },
];

const SEED_COLLABORATORS = [
  {
    documentId: 'seed-doc-4',
    userId: 'seed-user-1',
    permission: 'edit' as const,
  },
];

// --------------------------------------------------------------------------
// [SECTION] Seed Functions
// --------------------------------------------------------------------------

async function clearSeedData() {
  console.log('[*] Clearing existing seed data...');

  // [*] Delete in order due to foreign key constraints
  await db.delete(documentCollaborators);
  await db.delete(documents);
  await db.delete(users);

  console.log('[+] Seed data cleared');
}

async function seedUsers() {
  console.log('[*] Seeding users...');

  for (const user of SEED_USERS) {
    await db
      .insert(users)
      .values({
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();
  }

  console.log(`[+] Seeded ${SEED_USERS.length} users`);
}

async function seedDocuments() {
  console.log('[*] Seeding documents...');

  for (const doc of SEED_DOCUMENTS) {
    await db
      .insert(documents)
      .values({
        ...doc,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();
  }

  console.log(`[+] Seeded ${SEED_DOCUMENTS.length} documents`);
}

async function seedCollaborators() {
  console.log('[*] Seeding collaborators...');

  for (const collab of SEED_COLLABORATORS) {
    await db.insert(documentCollaborators).values(collab).onConflictDoNothing();
  }

  console.log(`[+] Seeded ${SEED_COLLABORATORS.length} collaborators`);
}

// --------------------------------------------------------------------------
// [SECTION] Main
// --------------------------------------------------------------------------

async function main() {
  console.log('');
  console.log('='.repeat(60));
  console.log('  MarkWrite Database Seeder');
  console.log('='.repeat(60));
  console.log('');

  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear') || args.includes('-c');

  try {
    if (shouldClear) {
      await clearSeedData();
    }

    await seedUsers();
    await seedDocuments();
    await seedCollaborators();

    console.log('');
    console.log('[ok] Database seeded successfully!');
    console.log('');
    console.log('Test credentials:');
    console.log('  - Username: demo_user');
    console.log('  - Note: Use GitHub OAuth to login (seed users are for reference)');
    console.log('');
  } catch (error) {
    console.error('[x] Seed failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
