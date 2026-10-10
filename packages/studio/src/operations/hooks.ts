import type { AgentPermissions } from '../protocol/index.ts'

export type StudioConnectedContext = {
  /**
   * The Studio instance this session attached to.
   */
  url: string
  /**
   * Both sides of the connection, so a host can print them and make a mismatch visible.
   */
  versions: {
    /**
     * The Studio instance's own version, when it sent one.
     */
    studio?: string
    /**
     * The version of the runtime that connected.
     */
    kubb: string
    /**
     * The version of the host itself, such as the `kubb` CLI or the agent image.
     */
    agent: string
  }
  /**
   * This agent's slug, refreshed on every connect so a rename in Studio shows up without a
   * re-pair. Absent when Studio predates the field.
   */
  agentSlug?: string
  /**
   * This agent's organization slug, absent for a sandbox or global agent, which has none, or when
   * Studio predates the field.
   */
  organizationSlug?: string
}

/**
 * Events a host emits about its Kubb Studio session, as opposed to a generation. `kubb:` stays
 * reserved for generation lifecycle.
 */
declare global {
  namespace Kubb {
    interface KubbHooksRegistry {
      /**
       * The Studio instance this session is opening against.
       */
      'studio:connecting': [ctx: { url: string }]
      'studio:connected': [ctx: StudioConnectedContext]
      /**
       * Fired once Studio confirms the `agent:connect` handshake was received and the session is
       * fully registered. Distinct from `studio:connected`, which only means the socket is open.
       */
      'studio:ready': [ctx: Record<string, never>]
      /**
       * Why Studio ended the session.
       */
      'studio:disconnected': [ctx: { reason: string }]
      /**
       * Milliseconds until the next connection attempt.
       */
      'studio:reconnecting': [ctx: { delayMs: number }]
      /**
       * The command Studio sent, without its `studio:` prefix: `generate`, `connect` or `save`.
       */
      'studio:command:start': [ctx: { command: string }]
      /**
       * The command that finished, with what it did when there is something to report:
       * `applied 2/3 edits to kubb.config.ts`.
       */
      'studio:command:end': [ctx: { command: string; info?: string }]
      /**
       * What was refused or ignored, and the missing permission if that is why, so the host can
       * append its own remedy.
       */
      'studio:warn': [ctx: { message: string; permission?: keyof AgentPermissions }]
      /**
       * The failure, for the host's own output. One Studio needs to hear about goes over the
       * socket through the `kubb:error` generation hook instead.
       */
      'studio:error': [ctx: { error: Error }]
    }
  }
}
