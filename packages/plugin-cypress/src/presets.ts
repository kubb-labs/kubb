import { definePresets } from '@kubb/core'
import { cypressGenerator } from './generators/cypressGenerator.tsx'
import { resolverCypress } from './resolvers/resolverCypress.ts'
import type { ResolverCypress } from './types.ts'

/**
 * Built-in preset registry for `@kubb/plugin-cypress`.
 *
 * - `default` — uses `resolverCypress` and `cypressGenerator`.
 * - `kubbV4`  — uses `resolverCypress` and `cypressGenerator` (same conventions as `default` for cypress).
 */
export const presetsCypress = definePresets<ResolverCypress>({
  default: {
    name: 'default',
    resolvers: [resolverCypress],
    generators: [cypressGenerator],
  },
  kubbV4: {
    name: 'kubbV4',
    resolvers: [resolverCypress],
    generators: [cypressGenerator],
  },
})
