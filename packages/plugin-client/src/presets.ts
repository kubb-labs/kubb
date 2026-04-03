import { definePresets } from '@kubb/core'
import { resolverClient } from './resolvers/resolverClient.ts'
import { resolverClientLegacy } from './resolvers/resolverClientLegacy.ts'
import type { ResolverClient } from './types.ts'

/**
 * Built-in preset registry for `@kubb/plugin-client`.
 *
 * - `default` — uses `resolverClient` with v5 naming conventions.
 * - `kubbV4`  — uses `resolverClientLegacy` with backward-compatible naming.
 *
 * Note: Unlike plugin-ts/plugin-zod, generators are not defined here because
 * plugin-client selects generators dynamically based on `clientType`, `group`,
 * and `operations` options. Generator selection happens in `plugin.ts`.
 */
export const presets = definePresets<ResolverClient>({
  default: {
    name: 'default',
    resolver: resolverClient,
  },
  kubbV4: {
    name: 'kubbV4',
    resolver: resolverClientLegacy,
  },
})
