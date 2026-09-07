// Better Auth (Google OAuth) client. `basePath` matches the server mount in
// server.ts, and the base URL defaults to the current origin (same-site).
// The React client works fine as an imperative API (no provider needed for
// signIn.social / getSession / signOut used here).
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  basePath: '/api/ba'
});

/** Start Google OAuth; the browser redirects to Google and back to the app. */
export function googleSignIn(callbackURL: string): Promise<unknown> {
  return authClient.signIn.social({ provider: 'google', callbackURL });
}