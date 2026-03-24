// ==========================================================================
// File    : index.ts
// Project : MarkWrite
// Layer   : Data
// Purpose : Drizzle ORM database client initialization.
//
// Author  : AuraEG Team
// Created : 2026-03-24
// ==========================================================================

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// [*] Use dynamic env to avoid build-time requirement
const DATABASE_URL = env.DATABASE_URL ?? 'postgresql://localhost:5432/markwrite';

const client = postgres(DATABASE_URL);

export const db = drizzle(client, { schema });

export * from './schema';
