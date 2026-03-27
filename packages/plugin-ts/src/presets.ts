import { definePresets } from '@kubb/core'
import { typeGenerator } from './generators/typeGenerator.tsx'
import { typeGeneratorLegacy } from './generators/typeGeneratorLegacy.tsx'
import { resolverTs } from './resolvers/resolverTs.ts'
import { resolverTsLegacy } from './resolvers/resolverTsLegacy.ts'
import type { ResolverTs } from './types.ts'

/**
 * Built-in preset registry for `@kubb/plugin-ts`.
 *
 * - `default` — uses `resolverTs` and `typeGenerator` (current naming conventions).
 * - `kubbV4` — uses `resolverTsLegacy` and `typeGeneratorLegacy` (Kubb v4 naming conventions).
 */
export const presets = definePresets<ResolverTs>({
  default: {
    name: 'default',
    resolvers: [resolverTs],
    generators: [typeGenerator],
  },
  kubbV4: {
    name: 'kubbV4',
    resolvers: [resolverTsLegacy],
    generators: [typeGeneratorLegacy],
  },
})
