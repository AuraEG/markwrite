// ==========================================================================
// File    : +page.server.ts
// Project : MarkWrite
// Layer   : Route
// Purpose : Server-side data loading for the settings page.
//
// Author  : AuraEG Team
// Created : 2026-04-02
// ==========================================================================

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // [*] Require authentication for settings page
  if (!locals.user) {
    throw redirect(302, '/');
  }

  return {
    user: locals.user,
  };
};
