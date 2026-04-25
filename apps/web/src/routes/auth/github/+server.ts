// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Route   : /auth/github
// Purpose : Initiate GitHub OAuth flow - redirects to GitHub authorization.
// ==========================================================================

import { error, redirect } from '@sveltejs/kit';
import { generateState } from 'arctic';
import { createGitHub } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url }) => {
  const state = generateState();
  let github: ReturnType<typeof createGitHub>;
  try {
    github = createGitHub(url);
  } catch (err) {
    console.error('[!] GitHub OAuth configuration error:', err);
    error(
      500,
      err instanceof Error
        ? err.message
        : 'GitHub OAuth configuration is invalid for this environment.'
    );
  }

  // [*] Include 'gist' scope for GitHub Gist sharing feature
  const authUrl = await github.createAuthorizationURL(state, { scopes: ['user:email', 'gist'] });

  // [*] Store state in cookie for CSRF protection
  cookies.set('github_oauth_state', state, {
    path: '/',
    secure: import.meta.env.PROD,
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax',
  });

  redirect(302, authUrl.toString());
};
