// ==========================================================================
// File    : github.ts
// Project : MarkWrite
// Layer   : Server Auth
// Purpose : GitHub OAuth provider configuration using Arctic.
//
// Author  : AuraEG Team
// Created : 2026-03-24
// ==========================================================================

import { GitHub } from 'arctic';
import { env } from '$env/dynamic/private';

// --------------------------------------------------------------------------
// [SECTION] GitHub OAuth Client
// --------------------------------------------------------------------------

// [*] Use dynamic env to avoid build-time requirement
const clientId = env.GITHUB_CLIENT_ID ?? '';
const clientSecret = env.GITHUB_CLIENT_SECRET ?? '';

export const github = new GitHub(clientId, clientSecret, {});

// --------------------------------------------------------------------------
// [SECTION] Type Definitions
// --------------------------------------------------------------------------

export interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
  name: string | null;
}
