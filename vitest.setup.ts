import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Testing Library doesn't auto-register cleanup with Vitest the way it does
// with Jest, so unmounted components leak into the next test's document body.
// Without this, document-scoped queries like `getByRole` see buttons from
// every prior `render()` in the same file.
afterEach(() => {
  cleanup();
});
