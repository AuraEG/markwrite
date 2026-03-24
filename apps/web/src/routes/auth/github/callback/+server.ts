// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Route   : /auth/github/callback
// Purpose : Handle GitHub OAuth callback - creates user session.
// ==========================================================================

import { error, redirect } from '@sveltejs/kit';
import { generateIdFromEntropySize } from 'lucia';
import { github, lucia, type GitHubUser } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
  // --------------------------------------------------------------------------
  // [SECTION] Validate OAuth State
  // --------------------------------------------------------------------------

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('github_oauth_state') ?? null;

  if (!code || !state || !storedState || state !== storedState) {
    error(400, 'Invalid OAuth state. Please try logging in again.');
  }

  // --------------------------------------------------------------------------
  // [SECTION] Exchange Code for Token
  // --------------------------------------------------------------------------

  let tokens;
  try {
    tokens = await github.validateAuthorizationCode(code);
  } catch (err) {
    console.error('[!] GitHub OAuth token exchange failed:', err);
    error(400, 'Failed to authenticate with GitHub. Please try again.');
  }

  // --------------------------------------------------------------------------
  // [SECTION] Fetch GitHub User Data
  // --------------------------------------------------------------------------

  const githubUserResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      'User-Agent': 'MarkWrite',
    },
  });

  if (!githubUserResponse.ok) {
    console.error('[!] Failed to fetch GitHub user data');
    error(500, 'Failed to retrieve user information from GitHub.');
  }

  const githubUser: GitHubUser = await githubUserResponse.json();

  // --------------------------------------------------------------------------
  // [SECTION] Create or Update User
  // --------------------------------------------------------------------------

  const existingUser = await db.query.users.findFirst({
    where: eq(users.githubId, String(githubUser.id)),
  });

  let userId: string;

  if (existingUser) {
    // [*] Update existing user's profile data
    userId = existingUser.id;
    await db
      .update(users)
      .set({
        username: githubUser.login,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  } else {
    // [+] Create new user
    userId = generateIdFromEntropySize(10);
    await db.insert(users).values({
      id: userId,
      githubId: String(githubUser.id),
      username: githubUser.login,
      email: githubUser.email,
      avatarUrl: githubUser.avatar_url,
    });
  }

  // --------------------------------------------------------------------------
  // [SECTION] Create Session
  // --------------------------------------------------------------------------

  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  cookies.set(sessionCookie.name, sessionCookie.value, {
    path: '.',
    ...sessionCookie.attributes,
  });

  // [*] Clear OAuth state cookie
  cookies.delete('github_oauth_state', { path: '/' });

  redirect(302, '/documents');
};
