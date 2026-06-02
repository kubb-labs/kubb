import type { KubbHooks } from './createKubb.ts'
import type { HookKind } from './HookRegistry.ts'

/**
 * Per-event `HookKind` declaration for `KubbHooks`. Used by the `HookRegistry` inside `KubbDriver`
 * to decide whether to dispatch sequentially (the default for every current hook) or to walk
 * tracked listeners and short-circuit on the first non-nullish result.
 *
 * Lives in its own module so the registry stays decoupled from `createKubb.ts` and to keep the
 * `KubbHooks` import out of `HookRegistry.ts`.
 */
export type KubbHookKinds = { [K in keyof KubbHooks]: HookKind }

/**
 * Concrete `KubbHookKinds` table. Every entry is `'sequential'` today — no current hook consumes a
 * return value through `emit`. Add a `'firstResult'` row the day a hook needs Rollup-style
 * short-circuit semantics; `as const satisfies KubbHookKinds` makes a missing row a compile error.
 */
export const kubbHookKinds = {
  'kubb:lifecycle:start': 'sequential',
  'kubb:lifecycle:end': 'sequential',
  'kubb:config:start': 'sequential',
  'kubb:config:end': 'sequential',
  'kubb:generation:start': 'sequential',
  'kubb:generation:end': 'sequential',
  'kubb:generation:summary': 'sequential',
  'kubb:format:start': 'sequential',
  'kubb:format:end': 'sequential',
  'kubb:lint:start': 'sequential',
  'kubb:lint:end': 'sequential',
  'kubb:hooks:start': 'sequential',
  'kubb:hooks:end': 'sequential',
  'kubb:hook:start': 'sequential',
  'kubb:hook:end': 'sequential',
  'kubb:version:new': 'sequential',
  'kubb:info': 'sequential',
  'kubb:error': 'sequential',
  'kubb:success': 'sequential',
  'kubb:warn': 'sequential',
  'kubb:debug': 'sequential',
  'kubb:files:processing:start': 'sequential',
  'kubb:files:processing:update': 'sequential',
  'kubb:files:processing:end': 'sequential',
  'kubb:plugin:start': 'sequential',
  'kubb:plugin:end': 'sequential',
  'kubb:plugin:setup': 'sequential',
  'kubb:build:start': 'sequential',
  'kubb:plugins:end': 'sequential',
  'kubb:build:end': 'sequential',
  'kubb:generate:schema': 'sequential',
  'kubb:generate:operation': 'sequential',
  'kubb:generate:operations': 'sequential',
} as const satisfies KubbHookKinds
