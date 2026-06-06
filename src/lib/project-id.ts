/**
 * Short, URL-safe project ids for `/studio/[projectId]`.
 *
 * Each call to `/studio` mints a fresh id and redirects the browser to
 * `/studio/<id>`, scoping the composition store per session and making
 * project URLs bookmarkable.
 *
 * Format: 10-char lowercase alphanumeric (`[0-9a-z]`). That's ~52 bits of
 * entropy — vastly more than we need to avoid collisions across one user's
 * sessions, while staying short enough to type or share.
 *
 * No external nanoid dep — `crypto.getRandomValues` is available in Edge,
 * Node 19+, and every modern browser, and that's all the runtime we target.
 */

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

export function generateProjectId(length = 10): string {
  const bytes = new Uint8Array(length);
  // `crypto` is the Web Crypto API — globally available in Next 16 server
  // and client runtimes. No imports needed.
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/**
 * Tight validator — guards against path-traversal or accidental slugs that
 * would collide with composition-store filenames (which are URL-encoded
 * already, but defence in depth).
 */
export function isValidProjectId(id: string): boolean {
  return /^[0-9a-z]{6,32}$/.test(id);
}
