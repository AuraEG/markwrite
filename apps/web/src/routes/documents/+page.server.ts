// ==========================================================================
// File    : +page.server.ts
// Project : MarkWrite
// Layer   : Route
// Purpose : Server load function for documents list page.
//
// Author  : AuraEG Team
// Created : 2026-03-25
// ==========================================================================

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // [*] Redirect unauthenticated users to home
  if (!locals.user) {
    throw redirect(302, '/');
  }

  return {
    user: locals.user,
  };
};
