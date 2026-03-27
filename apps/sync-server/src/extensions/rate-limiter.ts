// ==========================================================================
// File    : rate-limiter.ts
// Project : MarkWrite
// Layer   : Infrastructure / Extensions
// Purpose : Rate limiting for WebSocket connections to prevent abuse.
//
// Author  : AuraEG Team
// Created : 2026-03-27
// ==========================================================================

import { config } from '../config.js';

// --------------------------------------------------------------------------
// [SECTION] State
// --------------------------------------------------------------------------

// [*] Track connections per IP address
const connectionsByIp = new Map<string, Set<string>>();

// [*] Track connections per document
const connectionsByDocument = new Map<string, Set<string>>();

// --------------------------------------------------------------------------
// [SECTION] Rate Limiter
// --------------------------------------------------------------------------

/**
 * Checks if a connection should be allowed based on rate limits.
 * Throws an error if the limit is exceeded.
 */
export function checkRateLimit(ip: string, documentName: string, _connectionId: string): void {
  // [1] Check connections per IP
  const ipConnections = connectionsByIp.get(ip) || new Set();
  if (ipConnections.size >= config.maxConnectionsPerIp) {
    console.warn(`[!] Rate limit exceeded for IP: ${ip}`);
    throw new Error('Too many connections from this IP address');
  }

  // [2] Check connections per document
  const docConnections = connectionsByDocument.get(documentName) || new Set();
  if (docConnections.size >= config.maxConnectionsPerDocument) {
    console.warn(`[!] Rate limit exceeded for document: ${documentName}`);
    throw new Error('Too many connections to this document');
  }
}

/**
 * Registers a new connection for tracking.
 */
export function registerConnection(ip: string, documentName: string, connectionId: string): void {
  // [*] Track by IP
  if (!connectionsByIp.has(ip)) {
    connectionsByIp.set(ip, new Set());
  }
  connectionsByIp.get(ip)!.add(connectionId);

  // [*] Track by document
  if (!connectionsByDocument.has(documentName)) {
    connectionsByDocument.set(documentName, new Set());
  }
  connectionsByDocument.get(documentName)!.add(connectionId);
}

/**
 * Unregisters a connection when it closes.
 */
export function unregisterConnection(ip: string, documentName: string, connectionId: string): void {
  // [*] Remove from IP tracking
  const ipConnections = connectionsByIp.get(ip);
  if (ipConnections) {
    ipConnections.delete(connectionId);
    if (ipConnections.size === 0) {
      connectionsByIp.delete(ip);
    }
  }

  // [*] Remove from document tracking
  const docConnections = connectionsByDocument.get(documentName);
  if (docConnections) {
    docConnections.delete(connectionId);
    if (docConnections.size === 0) {
      connectionsByDocument.delete(documentName);
    }
  }
}

/**
 * Gets the current connection counts for monitoring.
 */
export function getConnectionStats(): {
  byIp: Record<string, number>;
  byDocument: Record<string, number>;
} {
  const byIp: Record<string, number> = {};
  const byDocument: Record<string, number> = {};

  connectionsByIp.forEach((connections, ip) => {
    byIp[ip] = connections.size;
  });

  connectionsByDocument.forEach((connections, doc) => {
    byDocument[doc] = connections.size;
  });

  return { byIp, byDocument };
}

/**
 * Clears all connection tracking (useful for testing).
 */
export function clearConnectionTracking(): void {
  connectionsByIp.clear();
  connectionsByDocument.clear();
}
