import type { KubbHooks } from 'kubb/kit'

/**
 * Event bus shared with `createKubb`. Core emits its lifecycle events here, and the runtime overlays
 * the synthetic `kubb:hook:line` event it produces while streaming output from spawned hook commands
 * (formatter, linter, user `done` hooks). Core itself does not emit this event.
 */
export type AgentHooks = KubbHooks & {
  'kubb:hook:line': [ctx: { id?: string; line: string }]
}
