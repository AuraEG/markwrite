// ==========================================================================
// File    : app.d.ts
// Project : MarkWrite
// Layer   : Types
// Purpose : SvelteKit type declarations for locals and page data.
//
// Author  : AuraEG Team
// Created : 2026-03-24
// ==========================================================================

import type { Session, User } from 'lucia';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
    }
    // interface Error {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
