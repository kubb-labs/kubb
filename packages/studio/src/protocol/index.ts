/**
 * WebSocket message types for the agent communication protocol.
 *
 * Messages flow bidirectionally between the Studio backend and CLI agents:
 * - Studio → Agent: CommandMessage (generate, connect), PongMessage, DisconnectMessage
 * - Agent → Studio: ConnectedMessage, DataMessage, PingMessage
 * - Either direction: ErrorMessage
 */

import type { Config } from '@kubb/core'

/**
 * JSON-serializable Kubb config exchanged over the WebSocket. A live `kubb/kit` config holds
 * functions and class instances that cannot survive JSON, so both sides pass this flattened shape
 * and rebuild the real config from it.
 */
export type JSONKubbConfig = {
  /**
   * Enabled plugins with their serialized options. `name` is the package name (e.g. `@kubb/plugin-ts`)
   * and `options` is an opaque blob the agent forwards unchanged to the plugin factory.
   */
  plugins?: Array<{
    name: string
    options?: object
  }>
  /**
   * Package names of plugins Studio explicitly turned off. Takes priority over the disk
   * config's `plugins` array, so a plugin listed here is dropped even when present on disk.
   */
  disabledPlugins?: Array<string>
  /**
   * Raw OpenAPI / Swagger spec content (YAML or JSON string).
   * Always honored for a 'sandbox' agent. For a non-sandbox agent it is honored only when the
   * agent opts in with `KUBB_AGENT_ALLOW_INPUT`; otherwise the spec is read from disk and this is ignored.
   */
  input?: string
  /**
   * Adapter option overrides sent from Studio UI. Merged into the disk config's adapter options
   * and re-applied through the same adapter factory, since an adapter instance's functions
   * (`parse`, `getImports`, ...) can't survive JSON serialization over the WebSocket.
   */
  adapter?: object
}

/**
 * One change to a plugin's options in the user's `kubb.config.ts`.
 *
 * `plugin` is the package name (`@kubb/plugin-ts`), the same identity used in {@link JSONKubbConfig}.
 * The agent applies these to the file with an AST patch, so only the targeted values are rewritten.
 *
 * Declared here rather than in `configFile.ts` because this is the wire contract, and the patcher
 * imports it from here. Type-only, so nothing pulls `ts-morph` into this entry point.
 */
export type ConfigEdit =
  /**
   * Write a literal option value. `path` walks nested objects, so `['enum', 'type']` targets
   * `pluginTs({ enum: { type } })`.
   */
  | { operation: 'set'; plugin: string; path: Array<string>; value: unknown }
  /**
   * Drop an option so the plugin falls back to its default.
   */
  | { operation: 'remove'; plugin: string; path: Array<string> }
  /**
   * Add a plugin factory call and its import to the `plugins` array.
   */
  | { operation: 'add-plugin'; plugin: string; importName?: string; options?: Record<string, unknown> }

/**
 * A plugin factory call the agent found in the `plugins` array of a `defineConfig(...)`.
 */
export type ManagedPlugin = {
  /**
   * Local identifier of the factory in the file, e.g. `pluginTs`. This is the alias when the plugin
   * was imported under one.
   */
  importName: string
  /**
   * Module the factory is imported from, e.g. `@kubb/plugin-ts`.
   */
  packageName: string
  /**
   * Top-level option keys, each flagged with whether the agent may write it. An option marked
   * `literal: false` holds a function or a reference the agent will not overwrite, so Studio shows
   * the control disabled rather than hiding it.
   */
  options: Record<string, { literal: boolean }>
}

/**
 * What the agent found in the user's config file, so Studio knows which controls it may offer.
 * Absent when the agent could not read the file at all.
 */
export type ConfigFileView =
  | {
      managed: true
      /**
       * Each plugin call in the file, with its top-level option keys. An option marked
       * `literal: false` holds a function or a reference the agent will not overwrite: Studio shows
       * the control disabled rather than hiding it.
       */
      plugins: Array<ManagedPlugin>
    }
  | {
      managed: false
      /**
       * Why the file is outside what the agent edits, for example an array config. Studio shows this
       * and offers no property-level controls.
       */
      reason: string
    }

/**
 * Outcome of a single {@link ConfigEdit}, returned in a {@link ConfigWrittenMessage}.
 */
export type ConfigEditOutcome = {
  edit: ConfigEdit
  applied: boolean
  /**
   * Why the edit was refused, absent when it was applied.
   */
  reason?: string
}

/**
 * Typed events sent by the Kubb agent to Studio over WebSocket.
 * Mirrors the single-context-object tuple style of {@link KubbHooks} in `kubb/kit`,
 * using JSON-serializable shapes (e.g. `sources` as a `Record` instead of `Map`,
 * `error` as `{ message; stack? }` instead of `Error`).
 */
export type KubbHooks = {
  'kubb:plugin:start': [ctx: { plugin: { name: string } }]
  'kubb:plugin:end': [ctx: { plugin: { name: string }; duration: number; success: boolean }]
  'kubb:build:start': [ctx: { config: { name?: string }; adapter: { name: string } }]
  'kubb:build:end': [ctx: { files: Array<{ path: string; name: string }>; outputDir: string }]
  'kubb:files:processing:start': [ctx: { total: number }]
  'kubb:files:processing:update': [
    ctx: {
      files: Array<{
        file: string
        processed: number
        total: number
        percentage: number
      }>
    },
  ]
  'kubb:files:processing:end': [ctx: { total: number }]
  'kubb:info': [ctx: { message: string; info?: string }]
  'kubb:success': [ctx: { message: string; info?: string }]
  'kubb:warn': [ctx: { message: string; info?: string }]
  'kubb:error': [ctx: { message: string; stack?: string }]
  'kubb:debug': [ctx: { logs: Array<string>; fileName?: string }]
  'kubb:generation:start': [ctx: { name?: string; plugins: number }]
  'kubb:generation:end': [ctx: { config: Config; storage: Record<string, string> }]
  'kubb:generation:summary': [ctx: { duration: number; fileCount: number; failedPlugins: number; status: 'success' | 'failed' }]
  'kubb:lifecycle:start': []
  'kubb:lifecycle:end': []
  'kubb:format:start': []
  'kubb:format:end': []
  'kubb:lint:start': []
  'kubb:lint:end': []
  'kubb:hooks:start': []
  'kubb:hooks:end': []
  'kubb:hook:start': [ctx: { id?: string; command: string; args?: Array<string> }]
  'kubb:hook:line': [ctx: { id: string; line: string }]
  'kubb:hook:end': [
    ctx: {
      id?: string
      command: string
      args?: Array<string>
      success: boolean
      error?: { message: string; stack?: string }
    },
  ]
}

export type KubbHook = keyof KubbHooks

/**
 * Command sent from Studio to Agent: either a `generate` run with a full Kubb config,
 * or a `connect` handshake carrying the write permissions granted for this session.
 */
export type CommandMessage =
  /**
   * Run a generation with the given config. `payload` is the merged config Studio wants generated.
   */
  | { type: 'command'; command: 'generate'; payload: JSONKubbConfig }
  /**
   * Open a session. `permissions.allowWrite` is the write access granted for this connection.
   */
  | {
      type: 'command'
      command: 'connect'
      permissions: {
        allowWrite: boolean
      }
    }
  /**
   * Change plugin options in the user's `kubb.config.ts`. Applied only when the agent was granted
   * `allowConfigEdit`; otherwise every edit comes back refused.
   */
  | { type: 'command'; command: 'write-config'; edits: Array<ConfigEdit> }

/**
 * Identifies the host running the Kubb runtime, so Studio can badge the connection and show the
 * real project instead of a container path. Optional: an older agent does not send it.
 */
export type ClientInfo = {
  /**
   * `cli` for a `kubb studio` connection from a developer's machine, `docker` for the agent image.
   */
  kind: 'cli' | 'docker'
  /**
   * Version of the host package (`@kubb/cli` or `kubb.agent`).
   */
  version: string
  /**
   * Absolute path of the project the host generates in.
   */
  cwd: string
  /**
   * Display name for the project, usually its directory name.
   */
  projectName?: string
}

/**
 * Payload of the `connected` handshake the agent sends when it attaches to a session. Carries the
 * agent's on-disk config baseline, granted permissions, reported versions, and workspace paths.
 */
export type ConnectMessagePayload = {
  /**
   * The versions the agent reports on connect.
   */
  versions?: {
    /**
     * The version of Kubb (the `kubb` package) the agent generates with.
     */
    kubb: string
    /**
     * The version of the host itself (the `kubb.agent` package or the `kubb` CLI).
     * Optional so a payload from an agent that predates the field still parses.
     */
    agent?: string
  }
  /**
   * The Kubb config path as configured (`KUBB_AGENT_CONFIG`), relative to `root` unless absolute.
   */
  configPath: string
  /**
   * The agent's project root (`KUBB_AGENT_ROOT`, or the working directory when unset). This is the
   * workspace that generation runs against.
   */
  root: string
  /**
   * The agent's on-disk config, the baseline every generation starts from. `studioConfig` layers the
   * user's last Studio choices on top of it.
   */
  config: JSONKubbConfig
  permissions: {
    /**
     * Whether the agent writes generated files to disk. False for a sandbox agent. For a local
     * agent it mirrors the agent's `KUBB_AGENT_ALLOW_WRITE`.
     */
    allowWrite: boolean
    /**
     * Whether the agent will accept and generate from an OpenAPI spec supplied by Studio.
     * Always true for a sandbox agent; otherwise it mirrors the agent's own opt-in. Studio reads
     * this to decide whether to send `input`. Optional, so an older agent that omits it is treated
     * as not accepting a Studio-supplied spec.
     */
    allowInput?: boolean
    /**
     * Whether the agent runs the formatter, the linter, and `output.postGenerate` as child
     * processes after a generation. Always true for the Docker agent, where the image bounds what
     * can run. The CLI runs in the user's own project and defaults it off.
     */
    allowExec?: boolean
    /**
     * Whether the agent may change plugin options in the user's `kubb.config.ts`. Separate from
     * `allowWrite`, which covers generated output: this one edits a hand-authored source file, so
     * it is granted on its own. Optional, so an older agent that omits it is treated as not
     * granting it.
     */
    allowConfigEdit?: boolean
  }
  /**
   * What the agent read from the config file on disk, so Studio can render the plugin editor
   * against the real file. Absent when the agent could not read it.
   */
  configFile?: ConfigFileView
  /**
   * Identifies the host, absent for an older agent that predates the field.
   */
  client?: ClientInfo
  /**
   * The most recent config a user picked in Studio, replayed on connect so Studio can prefill its UI
   * with the last-used options and spec. Absent when nothing has been saved. Layered on top of
   * `config` above, which stays the on-disk baseline.
   */
  studioConfig?: JSONKubbConfig
}

/**
 * Handshake reply sent from Agent to Studio after a `connect` command, carrying the agent's
 * resolved config, granted permissions, and reported versions.
 */
export type ConnectedMessage = {
  type: 'connected'
  payload: ConnectMessagePayload
}

/**
 * Reply to a `write-config` command: what the agent did to the file on disk.
 */
export type ConfigWrittenMessage = {
  type: 'config-written'
  payload: {
    /**
     * Per-edit result, in the order the edits were sent.
     */
    outcomes: Array<ConfigEditOutcome>
    /**
     * Whether the file on disk changed. False when every edit was refused, and when the applied
     * edits produced the text the file already had.
     */
    changed: boolean
    /**
     * The config file as it now stands, so Studio can re-render without a round trip. Absent when
     * nothing was written.
     */
    configFile?: ConfigFileView
  }
}

/**
 * Generic failure notice, sent by either side of the connection when something breaks outside the
 * normal `kubb:error` generation-hook flow (e.g. a malformed command).
 */
export type ErrorMessage = {
  type: 'kubb:error'
  message: string
}

/**
 * Heartbeat sent by the Agent to Studio so the connection is not treated as idle.
 */
export type PingMessage = {
  type: 'ping'
}

/**
 * Studio's reply to a `ping`, confirming the connection is still alive.
 */
export type PongMessage = {
  type: 'pong'
}

/**
 * Disconnect message sent from Studio to Agent when the session is expired or revoked.
 * The agent should close the connection without reconnecting.
 */
export type DisconnectMessage = {
  type: 'disconnect'
  reason: 'expired' | 'revoked'
}

/**
 * Payload of a `data` message: a single Kubb generation event forwarded to Studio in real time.
 * Generic over the hook name so `data` is typed to that hook's context tuple.
 */
export type DataMessagePayload<T extends KubbHook = KubbHook> = {
  /**
   * The Kubb hook this event is for (e.g. `kubb:plugin:start`).
   */
  type: T
  /**
   * The hook's context tuple, matching `KubbHooks[type]`.
   */
  data: KubbHooks[T]
  /**
   * When the agent emitted the event, epoch milliseconds.
   */
  timestamp: number
  /**
   * Monotonic per-connection counter stamped in the order the agent emits events. Studio orders the
   * event log by this, since `timestamp` has millisecond resolution and a full generation fires
   * dozens of events per tick, and the relay can deliver them out of order.
   */
  seq: number
}

/**
 * Envelope for a single generation event streamed from Agent to Studio. Wraps a
 * {@link DataMessagePayload} so both sides can switch on `type: 'data'`.
 */
export type DataMessage<T extends KubbHook = KubbHook> = {
  type: 'data'
  payload: DataMessagePayload<T>
}

/**
 * Response returned by the Studio `/api/agent/sessions` endpoint.
 */
export type AgentConnectResponse = {
  /**
   * WebSocket URL the agent opens to reach the session, with the session token embedded.
   */
  wsUrl: string
  /**
   * When the session expires and the wsUrl stops working (ISO 8601).
   */
  expiresAt: string
  /**
   * When the session was revoked (ISO 8601), or null while it is still valid.
   */
  revokedAt: string | null
  /**
   * Opaque session token, also embedded in `wsUrl`. Store it to revoke the session later.
   */
  sessionId: string
  /**
   * Short readable identifier for this connection, used in logs (e.g. brave-otter).
   */
  slug: string | null
  /**
   * Whether this session belongs to a shared sandbox agent rather than an owned one.
   */
  isSandbox: boolean
}

/**
 * Every message that can cross the agent WebSocket, in either direction. Narrow it with the
 * `is*Message` guards below before reading a variant's fields.
 */
export type AgentMessage = CommandMessage | DataMessage | ConnectedMessage | ConfigWrittenMessage | ErrorMessage | PingMessage | PongMessage | DisconnectMessage

// Helper type guards
export function isCommandMessage(msg: AgentMessage): msg is CommandMessage {
  return msg.type === 'command'
}

/**
 * Type guard to narrow a data message to a specific event type.
 *
 * @example
 * ```ts
 * if (isDataMessage(msg, 'kubb:plugin:start')) {
 *   // msg.payload.data is now typed as [ctx: { plugin: { name: string } }]
 *   const pluginName = msg.payload.data[0].plugin.name
 * }
 * ```
 */
export function isDataMessage<T extends KubbHook>(msg: AgentMessage, type?: T): msg is DataMessage<T> {
  return msg.type === 'data' && (type ? msg.payload.type === type : true)
}

export function isPongMessage(msg: AgentMessage): msg is PongMessage {
  return msg.type === 'pong'
}

export function isDisconnectMessage(msg: AgentMessage): msg is DisconnectMessage {
  return msg.type === 'disconnect'
}

export function isConnectedMessage(msg: AgentMessage): msg is ConnectedMessage {
  return msg.type === 'connected'
}

export function isConfigWrittenMessage(msg: AgentMessage): msg is ConfigWrittenMessage {
  return msg.type === 'config-written'
}
