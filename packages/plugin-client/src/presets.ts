import { definePresets } from '@kubb/core'
import { resolverClient } from './resolvers/resolverClient.ts'
import { resolverClientLegacy } from './resolvers/resolverClientLegacy.ts'
import type { ResolverClient } from './types.ts'

/**
 * Built-in preset registry for `@kubb/plugin-client`.
 *
 * - `default` — uses `resolverClient` with v5 naming conventions.
 * - `kubbV4`  — uses `resolverClientLegacy` with backward-compatible naming.
 */
export const presets = definePresets<ResolverClient>({
  default: {
    name: 'default',
    resolver: resolverClient,
    generators: [],
  },
  kubbV4: {
    name: 'kubbV4',
    resolver: resolverClientLegacy,
    generators: [],
  },
})
