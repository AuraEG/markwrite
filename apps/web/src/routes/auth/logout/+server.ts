// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Route   : /auth/logout
// Purpose : Handle user logout - invalidates session and clears cookies.
// ==========================================================================

import { redirect } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, cookies }) => {
  if (!locals.session) {
    redirect(302, '/');
  }

  // [*] Invalidate the current session
  await lucia.invalidateSession(locals.session.id);

  // [*] Clear the session cookie
  const sessionCookie = lucia.createBlankSessionCookie();
  cookies.set(sessionCookie.name, sessionCookie.value, {
    path: '.',
    ...sessionCookie.attributes,
  });

  // [*] Clear GitHub access token cookie
  cookies.delete('github_access_token', { path: '/' });

  redirect(302, '/');
};
