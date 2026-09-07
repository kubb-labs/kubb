import { pluginId as dryRunId } from '@gunshi/plugin-dryrun'
import type { DryRunExtension } from '@gunshi/plugin-dryrun'

export { dryRunId }

/**
 * Extension shape gunshi's command context carries once the `@gunshi/plugin-dryrun` plugin is
 * installed. Pass it as the `extensions` type parameter to `defineWithTypes`.
 */
export type DryRunExtensions = {
  [dryRunId]: DryRunExtension
}
