import { definePresets } from '@kubb/core'
import { mcpGenerator } from './generators/mcpGenerator.tsx'
import { serverGenerator } from './generators/serverGenerator.tsx'
import { serverGeneratorLegacy } from './generators/serverGeneratorLegacy.tsx'
import { resolverMcp } from './resolvers/resolverMcp.ts'
import type { ResolverMcp } from './types.ts'

/**
 * Built-in preset registry for `@kubb/plugin-mcp`.
 *
 * - `default` — v5 naming with individual zod schemas and per-status responses.
 * - `kubbV4`  — legacy naming with grouped zod schemas and combined responses.
 */
export const presets = definePresets<ResolverMcp>({
  default: {
    name: 'default',
    resolver: resolverMcp,
    generators: [mcpGenerator, serverGenerator],
  },
  kubbV4: {
    name: 'kubbV4',
    resolver: resolverMcp,
    generators: [mcpGenerator, serverGeneratorLegacy],
  },
})
