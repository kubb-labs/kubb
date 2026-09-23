import type { KubbHooks } from '@kubb/core'

/**
 * JSON-serializable Kubb config exchanged over RPC. A live `kubb/kit` config holds
 * functions and class instances that cannot survive JSON, so both sides pass this flattened shape
 * and rebuild the real config from it.
 */
export type JSONKubbConfig = {
  /**
   * Plugins with their serialized options. `name` is the package name (e.g. `@kubb/plugin-ts`)
   * and `options` is an opaque blob the agent forwards unchanged to the plugin factory. An entry
   * with `disabled: true` is dropped even when the disk config's `plugins` array still lists it.
   */
  plugins?: Array<{
    name: string
    options?: object
    disabled?: boolean
  }>
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
 * Which `defineConfig(...)` entry an edit targets, for a config file that exports an array.
 *
 * A number selects by position, a string matches the entry's `name`. Omitted targets the only
 * entry, or the first one when the file exports an array.
 */
export type ConfigRef = string | number

/**
 * A value the agent can read out of a plugin option in `kubb.config.ts` and round-trip through JSON.
 */
export type OptionValue = string | number | boolean | null | Array<OptionValue> | { [key: string]: OptionValue }

/**
 * One change to a plugin's options in the user's `kubb.config.ts`.
 *
 * `plugin` is the package name (`@kubb/plugin-ts`), the same identity used in {@link JSONKubbConfig}.
 * The agent applies these to the file with an AST patch, so only the targeted values are rewritten.
 *
 * Declared here rather than in `configFile.ts` because this is the wire contract, and the patcher
 * imports it from here. Type-only, so nothing pulls `magicast` into this entry point.
 */
export type ConfigEdit =
  /**
   * Write a literal option value. `path` walks nested objects, so `['enum', 'type']` targets
   * `pluginTs({ enum: { type } })`.
   */
  | { operation: 'set'; config?: ConfigRef; plugin: string; path: Array<string>; value: unknown }
  /**
   * Drop an option so the plugin falls back to its default.
   */
  | { operation: 'remove'; config?: ConfigRef; plugin: string; path: Array<string> }
  /**
   * Add a plugin factory call and its import to the `plugins` array.
   */
  | { operation: 'add-plugin'; config?: ConfigRef; plugin: string; importName?: string; options?: Record<string, unknown> }
  /**
   * Comment the plugin call out, keeping its options in the file so enabling it again restores them.
   */
  | { operation: 'disable-plugin'; config?: ConfigRef; plugin: string }
  /**
   * Uncomment a plugin call a previous `disable-plugin` commented out.
   */
  | { operation: 'enable-plugin'; config?: ConfigRef; plugin: string }

/**
 * A plugin factory call the agent found in the `plugins` array of a `defineConfig(...)`.
 */
export type PluginView = {
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
   * Top-level option keys, each flagged with whether the agent may write it and, when it can, the
   * value found in the file. An option marked `literal: false` holds a function or a reference the
   * agent will not overwrite, so Studio shows the control disabled rather than hiding it, and
   * `value` is absent since there is nothing safe to display as the current value.
   */
  options: Record<string, { literal: boolean; value?: OptionValue }>
  /**
   * Set when the plugin call is commented out in the file. Its options stay on disk but are not
   * readable, so `options` is empty until it is enabled again.
   */
  disabled?: true
}

/**
 * One `defineConfig(...)` entry. A config file that exports a single object has exactly one.
 */
export type ConfigView = {
  /**
   * The entry's `name`, when it sets one. Studio labels the config picker with it.
   */
  name?: string
  /**
   * Each plugin call in the entry, with its top-level option keys.
   */
  plugins: Array<PluginView>
}

/**
 * What the agent found in the user's config file, so Studio knows which controls it may offer.
 * Absent when the agent could not read the file at all.
 */
export type ConfigFileView =
  | {
      managed: true
      /**
       * One entry per config the file exports, in source order. Every {@link ConfigEdit} names
       * which of these it targets through its `config` field.
       */
      configs: Array<ConfigView>
    }
  | {
      managed: false
      /**
       * Why the file is outside what the agent edits, for example a default export that is not a
       * `defineConfig(...)` call. Studio shows this and offers no property-level controls.
       */
      reason: string
    }

/**
 * Outcome of a single {@link ConfigEdit}, returned in a {@link ConfigSavedMessage}.
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
 * The public, JSON-safe subset of Kubb lifecycle hooks. The core registry remains extensible;
 * adding a core hook does not publish it to Studio until it is listed here and projected below.
 */
export const generationEventTypes = [
  'kubb:plugin:start',
  'kubb:plugin:end',
  'kubb:build:start',
  'kubb:build:end',
  'kubb:files:processing:start',
  'kubb:files:processing:update',
  'kubb:files:processing:end',
  'kubb:info',
  'kubb:success',
  'kubb:warn',
  'kubb:error',
  'kubb:diagnostic',
  'kubb:generation:start',
  'kubb:generation:end',
  'kubb:generation:summary',
  'kubb:lifecycle:start',
  'kubb:lifecycle:end',
  'kubb:format:start',
  'kubb:format:end',
  'kubb:lint:start',
  'kubb:lint:end',
  'kubb:hooks:start',
  'kubb:hooks:end',
  'kubb:hook:start',
  'kubb:hook:line',
  'kubb:hook:end',
] as const satisfies ReadonlyArray<keyof KubbHooks>

/**
 * One of the lifecycle hooks {@link generationEventTypes} publishes.
 */
export type GenerationEventType = (typeof generationEventTypes)[number]

/**
 * The JSON-safe payload each published event carries. These are flattened on purpose: a core hook
 * context holds live objects (a `Config`, a `Storage`) that cannot cross the wire.
 */
export type GenerationEventPayloads = {
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
  'kubb:diagnostic': [
    ctx: {
      code: string
      message: string
      severity: string
      location?: { kind: string; pointer?: string; ref?: string }
      help?: string
      plugin?: string
      stack?: string
    },
  ]
  'kubb:generation:start': [ctx: { name?: string; plugins: number }]
  /**
   * A run finished. See `kubb:build:end` for files, `kubb:generation:summary` for the count, and
   * `readFiles` for contents.
   */
  'kubb:generation:end': []
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

/**
 * Versioned envelope around one lifecycle event. Cap'n Web streams preserve the order the agent
 * emitted them in, so the receiver replays a run by reading the stream straight through.
 */
export type GenerationEvent = {
  [Type in GenerationEventType]: { type: Type; data: GenerationEventPayloads[Type] }
}[GenerationEventType] & {
  version: 1
  jobId: string
  timestamp: number
}

/**
 * Asks the agent to run one generation. `jobId` tags every event the run emits so a caller
 * watching several runs can tell them apart.
 */
export type GenerateInput = { jobId: string; config: JSONKubbConfig }

/**
 * What a finished run produced.
 */
export type GenerateResult = {
  status: 'success' | 'failed'
  /**
   * Paths of the generated files, relative to the output directory.
   */
  files: Array<string>
  fileCount: number
  /**
   * Content fingerprint per file in `files`, to tell changed files apart without reading them.
   */
  hashes: Record<string, string>
  /**
   * Fingerprints of the output directory on disk before the run, for an agent with a project on disk.
   */
  disk?: { hashes: Record<string, string> }
}

/**
 * Asks the agent to apply a batch of edits to the config file on disk.
 */
export type SaveConfigInput = { edits: Array<ConfigEdit> }

/**
 * Per-edit outcomes plus the rewritten file. `changed` is false when every edit was a no-op, so a
 * caller can skip reloading.
 */
export type SaveResult = { outcomes: Array<ConfigEditOutcome>; changed: boolean; file?: ConfigFileView }

/**
 * What a file read returns for a job: the files that job generated (`output`), or what the output
 * directory held on disk before that job ran (`disk`, only on an agent with a project on disk).
 */
export type FileSource = 'output' | 'disk'

/**
 * Asks the agent to read files of one generation job back.
 */
export type ReadFilesInput = {
  /**
   * The job whose files to read, the only lookup key, so the caller decides whose jobs a reader may
   * see. A job the agent no longer keeps fails with {@link GENERATION_GONE_MESSAGE}.
   */
  jobId: string
  /**
   * At most {@link MAX_FILES_PER_REQUEST} paths, each checked against what the job's set holds.
   */
  paths: Array<string>
  /**
   * Which of the job's sets to read, `output` when left out.
   */
  source?: FileSource
}

/**
 * The error a file read fails with once the agent no longer keeps the job's files.
 */
export const GENERATION_GONE_MESSAGE = 'The files of this generation are no longer kept on the agent, run the generation again'

/**
 * Describes the package to pack and where to PUT it. `uploadPath` is resolved against the Studio
 * origin, so it cannot redirect the upload elsewhere.
 */
export type PublishSnapshotInput = { name: string; version: string; bundledDependencies?: Array<string>; uploadPath: string }

/**
 * Identifies the uploaded snapshot. `integrity` is the subresource hash Studio verifies against.
 */
export type PublishSnapshotResult = { integrity: string; peerDependencies: Record<string, string> }

/**
 * A generation in flight. Cap'n Web keeps the three calls pointed at the same run, so a caller can
 * read `events()` while `result()` is still pending and `cancel()` stops it early.
 */
export type GenerationRun = {
  events: () => Promise<ReadableStream<GenerationEvent>>
  result: () => Promise<GenerateResult>
  cancel: () => Promise<void>
}

/**
 * Operations Studio can invoke on an agent through a host-provided RPC transport.
 */
export type AgentApi = {
  connect: () => Promise<ConnectMessagePayload>
  startGeneration: (input: GenerateInput) => GenerationRun
  saveConfig: (input: SaveConfigInput) => Promise<SaveResult>
  publishSnapshot: (input: PublishSnapshotInput) => Promise<PublishSnapshotResult>
  readFiles: (input: ReadFilesInput) => Promise<{ files: Record<string, string> }>
}

/**
 * Operations an agent can invoke on Studio through a host-provided RPC transport.
 */
export type StudioApi = {
  ping: () => Promise<void>
}

/**
 * A live RPC session. `closed` settles when the transport drops, whichever side ended it.
 */
export type RpcConnection = {
  studio: StudioApi
  closed: Promise<void>
  close: () => void
}

/**
 * Opens a transport and hands both sides their peer. Swapping this is how a test drives a session
 * without a socket.
 */
export type RpcConnector = (input: { url: string; token: string; local: AgentApi }) => Promise<RpcConnection>

/**
 * How many files a single `readFiles` request may ask for at once.
 */
export const MAX_FILES_PER_REQUEST = 50

/**
 * Identifies the host running the Kubb runtime. Local to the runtime, not part of the wire: it
 * picks which remedy a refused-permission warning names. Distinct from an agent's `type` (`user`,
 * `cli`, `ci`, `sandbox`, `global`), which is what Studio records the agent as at pairing.
 */
export type ClientInfo = {
  /**
   * `cli` for any `kubb` invocation, including `kubb studio snapshot` from CI. `docker` for the
   * agent image.
   */
  kind: 'cli' | 'docker'
}

/**
 * Connection payload returned by {@link AgentApi.connect}. Carries only what Studio renders, with
 * everything about the config under one key.
 */
export type ConnectMessagePayload = {
  /**
   * Always sent, so a mismatch is visible on both sides: Studio badges the connection with these
   * and the host prints them.
   */
  versions: {
    /**
     * The version of the `@kubb/studio` runtime the agent runs.
     */
    kubb: string
    /**
     * The version of the host itself (the `kubb.agent` package or the `kubb` CLI).
     */
    agent: string
  }
  /**
   * The agent's project root (`KUBB_AGENT_ROOT`, or the working directory when unset). This is the
   * workspace that generation runs against.
   */
  root: string
  /**
   * The baseline every generation starts from.
   */
  config: {
    /**
     * The config path as configured (`KUBB_AGENT_CONFIG`), relative to `root` unless absolute.
     */
    path: string
    /**
     * What the agent read out of the config file itself, so Studio can render the plugin editor
     * against the real file. Absent when the agent could not read it, or was not granted
     * `allowConfigEdit`.
     */
    file?: ConfigFileView
    /**
     * Plugins the config registers, with their serialized options.
     */
    plugins?: Array<{
      name: string
      options?: object
    }>
  }
  permissions: AgentPermissions
}

/**
 * What an agent may do in the project it serves. Every one is off unless the host granted it, and
 * a sandbox session narrows them further.
 */
export type AgentPermissions = {
  /**
   * Whether the agent writes generated files to disk. False for a sandbox agent. For a local
   * agent it mirrors the agent's `KUBB_AGENT_ALLOW_WRITE`.
   */
  allowWrite: boolean
  /**
   * Whether the agent will accept and generate from an OpenAPI spec supplied by Studio.
   * Always true for a sandbox agent, otherwise it mirrors the agent's own opt-in. Studio reads
   * this to decide whether to send `input`.
   */
  allowInput: boolean
  /**
   * Whether the agent runs the formatter, the linter, and `output.postGenerate` as child
   * processes after a generation. Always true for the Docker agent, where the image bounds what
   * can run. The CLI runs in the user's own project and defaults it off.
   */
  allowExec: boolean
  /**
   * Whether the agent may change plugin options in the user's `kubb.config.ts`. Separate from
   * `allowWrite`, which covers generated output: this one edits a hand-authored source file.
   */
  allowConfigEdit: boolean
  /**
   * Whether the agent hands back file source in response to `readFiles`. Always true for a
   * sandbox agent; for a local agent it mirrors the agent's own opt-in.
   */
  allowRead: boolean
}

/**
 * Response returned by the Studio `/api/agent/sessions` endpoint.
 */
export type AgentConnectResponse = {
  /**
   * URL the agent opens to reach the session, with the session token embedded.
   */
  url: string
  /**
   * When the session expires and the url stops working (ISO 8601).
   */
  expiresAt: string
  /**
   * When the session was revoked (ISO 8601), or null while it is still valid.
   */
  revokedAt: string | null
  /**
   * Opaque session token, also embedded in `url`. Store it to revoke the session later.
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
  /**
   * The Studio instance's own version. Returned with the RPC session so the agent can name both
   * sides from the first connection.
   * Absent when Studio predates the field.
   */
  version?: string
  /**
   * This agent's slug, so a reconnect refreshes it the same way pairing did.
   * Absent when Studio predates the field.
   */
  agentSlug?: string
  /**
   * This agent's organization slug, absent for a sandbox or global agent, which has none, or when
   * Studio predates the field.
   */
  organizationSlug?: string
}
