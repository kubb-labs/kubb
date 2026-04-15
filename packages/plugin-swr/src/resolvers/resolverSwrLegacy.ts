import { defineResolver } from '@kubb/core'
import type { PluginSwr } from '../types.ts'
import { resolverSwr } from './resolverSwr.ts'

/**
 * Legacy resolver for `@kubb/plugin-swr` that reproduces the naming conventions
 * used in Kubb v4. Enable via `compatibilityPreset: 'kubbV4'`.
 *
 * The naming logic is identical to the default resolver — the only difference
 * is the `name` field (`'kubbV4'` vs `'default'`) so the driver can
 * distinguish presets.
 */
export const resolverSwrLegacy = defineResolver<PluginSwr>(() => ({
  ...resolverSwr,
  name: 'kubbV4',
  pluginName: 'plugin-swr',
}))
