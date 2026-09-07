// Signed read-only share links.
//
// A share link is `(?share=1&user=<userId>&id=<workspaceId>&sig=<hmac>)`. The
// signature binds the owner + workspace id to the server's secret, so a same
// process can verify the link was issued by us and never tampered with. The
// link grants READ access to that one workspace to anyone holding it — exactly
// the mental model of a "share" link — nothing else (no account, no writes).
//
// The secret is read from SHARE_SECRET, falling back to BETTER_AUTH_SECRET so a
// single secret covers both signing uses, then to a static dev default. A
// missing secret never blocks the feature; production just can't rotate links
// independently of the auth secret (acceptable for read-only previews).
import { createHmac, timingSafeEqual } from 'crypto';
import { getSecret } from './secrets';

const DEFAULT_SHARE_SECRET = 'awde-share-dev-secret';

export function shareSecret(): string {
  return getSecret('SHARE_SECRET') || getSecret('BETTER_AUTH_SECRET') || DEFAULT_SHARE_SECRET;
}

function sign(value: string): string {
  return createHmac('sha256', shareSecret()).update(value).digest('hex');
}

/** Build the signature for an owner+workspace pair. */
export function issueShareSig(userId: string, workspaceId: string): string {
  return sign(`${userId}:${workspaceId}`);
}

/** Constant-time verify: rejects wrong-length or mismatched signatures. */
export function verifyShareSig(userId: string, workspaceId: string, sig: string): boolean {
  const expected = Buffer.from(sign(`${userId}:${workspaceId}`), 'utf8');
  const given = Buffer.from(String(sig || ''), 'utf8');
  if (given.length !== expected.length) return false;
  return timingSafeEqual(expected, given);
}