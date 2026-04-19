import { createJiti } from "jiti";

/**
 * Shared jiti instance for dynamic ESM/TS imports across CLI commands.
 * Created once at module scope to avoid the overhead of repeated instantiation.
 */
export const jiti = createJiti(import.meta.url, {
  sourceMaps: true,
});
