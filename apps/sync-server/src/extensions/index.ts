// ==========================================================================
// File    : index.ts
// Project : MarkWrite
// Layer   : Infrastructure / Extensions
// Purpose : Barrel export for all Hocuspocus extensions.
//
// Author  : AuraEG Team
// Created : 2026-03-27
// ==========================================================================

export { onAuthenticate, onConnect, type AuthContext, type AuthenticatedUser } from './auth.js';
export { createPersistenceConfig, createDebounceConfig } from './persistence.js';
export {
  checkRateLimit,
  registerConnection,
  unregisterConnection,
  getConnectionStats,
  clearConnectionTracking,
} from './rate-limiter.js';
export {
  onAwarenessUpdate,
  createUserAwareness,
  getUserColor,
  type UserPresence,
} from './presence.js';
