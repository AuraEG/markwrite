// ==========================================================================
// File    : github.ts
// Project : MarkWrite
// Layer   : Server Auth
// Purpose : GitHub OAuth provider configuration using Arctic.
//
// Author  : AuraEG Team
// Created : 2026-03-24
// ==========================================================================

import { GitHub } from 'arctic';
import { env } from '$env/dynamic/private';

// --------------------------------------------------------------------------
// [SECTION] GitHub OAuth Client
// --------------------------------------------------------------------------

const localhostHosts = new Set(['localhost', '127.0.0.1', '::1']);

const isLocalhost = (hostname: string): boolean => localhostHosts.has(hostname);

// [*] Build a provider per request so local and production callbacks stay isolated.
// [*] Production keeps existing credentials/behavior unless redirect env is explicitly provided.
export const createGitHub = (requestUrl: URL): GitHub => {
  const isLocalRequest = isLocalhost(requestUrl.hostname);
  const localClientId = env.GITHUB_LOCAL_CLIENT_ID ?? '';
  const localClientSecret = env.GITHUB_LOCAL_CLIENT_SECRET ?? '';
  const useLocalCredentials = isLocalRequest && localClientId !== '' && localClientSecret !== '';

  if (isLocalRequest && !useLocalCredentials) {
    throw new Error(
      'Local GitHub OAuth is not configured. Set GITHUB_LOCAL_CLIENT_ID and GITHUB_LOCAL_CLIENT_SECRET for localhost sign-in.'
    );
  }

  const clientId = useLocalCredentials ? localClientId : (env.GITHUB_CLIENT_ID ?? '');
  const clientSecret = useLocalCredentials ? localClientSecret : (env.GITHUB_CLIENT_SECRET ?? '');

  const redirectURI = useLocalCredentials
    ? (env.GITHUB_LOCAL_REDIRECT_URI ?? `${requestUrl.origin}/auth/github/callback`)
    : env.GITHUB_REDIRECT_URI;

  return new GitHub(clientId, clientSecret, redirectURI ? { redirectURI } : {});
};

// --------------------------------------------------------------------------
// [SECTION] Type Definitions
// --------------------------------------------------------------------------

export interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
  name: string | null;
}
