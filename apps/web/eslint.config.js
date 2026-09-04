import { nextJsConfig } from "@risingbrain/config-eslint/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  // Throwaway connection-pool probe kept at the app root; it is a standalone
  // Node script, not part of the build, and trips the browser-globals config.
  { ignores: ["_pooltest.mjs"] },
  ...nextJsConfig,
];
