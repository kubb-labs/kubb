/**
 * Import paths that use a namespace import (`import * as z from '...'`).
 * All other import paths use a named import (`import { z } from '...'`).
 */
export const ZOD_NAMESPACE_IMPORTS = new Set(['zod', 'zod/mini'] as const)

/**
 * Filename for the generated operations barrel file.
 */
export const OPERATIONS_FILENAME = 'operations.ts' as const
