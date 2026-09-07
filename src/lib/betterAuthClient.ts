// Better Auth (Google OAuth) client. `basePath` matches the server mount in
// server.ts, and the base URL defaults to the current origin (same-site).
// The React client works fine as an imperative API (no provider needed for
// signIn.social / getSession / signOut used here).
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  basePath: '/api/ba'
});

/**
 * Start Google OAuth. `signIn.social` POSTs to /api/ba/sign-in/social, which
 * returns { url, redirect: true }; the client's built-in redirect plugin then
 * navigates the browser to Google. Resolves true when a redirect was issued.
 */
export async function googleSignIn(callbackURL: string): Promise<boolean> {
  const res = await authClient.signIn.social({ provider: 'google', callbackURL });
  if (res.data?.url && res.data.redirect) return true;
  throw new Error(res.error?.message || 'Google sign-in failed');
}