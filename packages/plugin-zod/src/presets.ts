import { definePresets } from '@kubb/core'
import { zodGenerator } from './generators/zodGenerator.tsx'
import { zodGeneratorLegacy } from './generators/zodGeneratorLegacy.tsx'
import { printerZod } from './printers/printerZod.ts'
import { resolverZod } from './resolvers/resolverZod.ts'
import { resolverZodLegacy } from './resolvers/resolverZodLegacy.ts'
import type { ResolverZod } from './types.ts'

/**
 * Built-in preset registry for `@kubb/plugin-zod`.
 *
 * - `default` — uses `resolverZod` and `zodGenerator` (current naming conventions).
 * - `kubbV4` — uses `resolverZodLegacy` and `zodGeneratorLegacy` (Kubb v4 naming conventions).
 *
 * Note: `printerZodMini` is selected at runtime by the generator when `mini: true` is set.
 */
export const presets = definePresets<ResolverZod>({
  default: {
    name: 'default',
    resolvers: [resolverZod],
    generators: [zodGenerator],
    printer: printerZod,
  },
  kubbV4: {
    name: 'kubbV4',
    resolvers: [resolverZodLegacy],
    generators: [zodGeneratorLegacy],
    printer: printerZod,
  },
})
