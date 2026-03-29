import { definePresets } from '@kubb/core'
import { zodGenerator } from './generators/zodGenerator.tsx'
import { resolverZod } from './resolvers/resolverZod.ts'
import type { ResolverZod } from './types.ts'

/**
 * Built-in preset registry for `@kubb/plugin-zod`.
 *
 * - `default` — uses `resolverZod` and `zodGenerator` (current naming conventions).
 * - `kubbV4` — uses `resolverZod` and `zodGenerator` (same defaults; no legacy naming needed for zod).
 */
export const presets = definePresets<ResolverZod>({
  default: {
    name: 'default',
    resolvers: [resolverZod],
    generators: [zodGenerator],
  },
  kubbV4: {
    name: 'kubbV4',
    resolvers: [resolverZod],
    generators: [zodGenerator],
  },
})
