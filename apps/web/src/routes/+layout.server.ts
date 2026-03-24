// ==========================================================================
// File    : +layout.server.ts
// Project : MarkWrite
// Purpose : Root layout server load - provides user data to all pages.
// ==========================================================================

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    user: locals.user,
  };
};
