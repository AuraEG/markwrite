// ==========================================================================
// File    : hooks.server.ts
// Project : MarkWrite
// Purpose : Server hooks for session validation on every request.
// ==========================================================================

import { lucia } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // --------------------------------------------------------------------------
  // [SECTION] Session Cookie Validation
  // --------------------------------------------------------------------------

  const sessionId = event.cookies.get(lucia.sessionCookieName);

  if (!sessionId) {
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }

  const { session, user } = await lucia.validateSession(sessionId);

  // --------------------------------------------------------------------------
  // [SECTION] Session Cookie Refresh
  // --------------------------------------------------------------------------

  if (session && session.fresh) {
    // [*] Session was extended, update the cookie
    const sessionCookie = lucia.createSessionCookie(session.id);
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes,
    });
  }

  if (!session) {
    // [*] Session is invalid, clear the cookie
    const sessionCookie = lucia.createBlankSessionCookie();
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes,
    });
  }

  // --------------------------------------------------------------------------
  // [SECTION] Attach User & Session to Locals
  // --------------------------------------------------------------------------

  event.locals.user = user;
  event.locals.session = session;

  return resolve(event);
};
