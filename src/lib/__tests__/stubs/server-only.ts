/**
 * Stands in for the `server-only` package under vitest.
 *
 * `server-only` has no Node entry point: it exists to make a build fail when a
 * server module is imported into a client bundle, and importing it outside
 * that build throws. The guard is worth keeping on modules that read secrets
 * such as GA4_API_SECRET, so the test run is pointed here instead of the
 * import being dropped from the source.
 */
export {};
