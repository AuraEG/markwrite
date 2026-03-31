// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Route   : /auth/github
// Purpose : Initiate GitHub OAuth flow - redirects to GitHub authorization.
// ==========================================================================

import { redirect } from '@sveltejs/kit';
import { generateState } from 'arctic';
import { github } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
  const state = generateState();

  // [*] Include 'gist' scope for GitHub Gist sharing feature
  const url = await github.createAuthorizationURL(state, { scopes: ['user:email', 'gist'] });

  // [*] Store state in cookie for CSRF protection
  cookies.set('github_oauth_state', state, {
    path: '/',
    secure: import.meta.env.PROD,
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax',
  });

  redirect(302, url.toString());
};
