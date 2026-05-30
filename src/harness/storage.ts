/**
 * Storage factory for the Mastra harness.
 *
 * Pluggable via env vars — zero-config default works for local dev:
 *
 *   VIBEFRAMES_DB_URL          (default: "file:./.data/vibeframes.db")
 *   VIBEFRAMES_DB_AUTH_TOKEN   (optional — for Turso / remote libSQL)
 *
 * Set `VIBEFRAMES_DB_URL=:memory:` for ephemeral (tests / one-shot demos).
 * Set a `libsql://…` URL + auth token for Turso in serverless deployments.
 */

import { LibSQLStore } from "@mastra/libsql";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DEFAULT_DB_URL = "file:./.data/vibeframes.db";

export function getDbUrl(): string {
  return process.env.VIBEFRAMES_DB_URL?.trim() || DEFAULT_DB_URL;
}

export function getDbAuthToken(): string | undefined {
  const token = process.env.VIBEFRAMES_DB_AUTH_TOKEN?.trim();
  return token || undefined;
}

/**
 * Build a LibSQL store, ensuring the parent directory exists for file:// URLs
 * so a fresh clone with no `.data/` folder still boots cleanly.
 */
export function createHarnessStorage(): LibSQLStore {
  const url = getDbUrl();
  const authToken = getDbAuthToken();

  if (url.startsWith("file:")) {
    const filePath = url.replace(/^file:/, "");
    try {
      mkdirSync(dirname(filePath), { recursive: true });
    } catch {
      // dir already exists or unwritable — let LibSQL surface a real error
    }
  }

  return new LibSQLStore({
    id: "vibeframes-libsql",
    url,
    ...(authToken ? { authToken } : {}),
  });
}
