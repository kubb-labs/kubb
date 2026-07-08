/**
 * File extensions a Kubb config is allowed to use. A config path with any other
 * extension is rejected before it is loaded.
 */
export const ALLOWED_CONFIG_EXTENSIONS = new Set(['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs'])
