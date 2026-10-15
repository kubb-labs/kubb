import type { InputNode } from '@kubb/ast'
import type { ExtensionKind, ExtensionManifest, KubbHooks } from '@kubb/core'

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
   * Raw OpenAPI / Swagger spec content (YAML or JSON string), never a file path or URL.
   * Required by a 'sandbox' agent, which has no disk config of its own and refuses anything else.
   * A non-sandbox agent always reads its spec from disk, so this is ignored with a `kubb:warn`.
   */
  input?: string
  /**
   * Adapter option overrides sent from Studio UI. Merged into the disk config's adapter options
   * and re-applied through the same adapter factory, since an adapter instance's functions
   * (`parse`, `getImports`, ...) can't survive JSON serialization over the WebSocket.
   */
  adapter?: object
  /**
   * Parser option overrides from Studio, matched to the disk config's parsers by `name` and
   * re-applied through each parser's factory, the same way `adapter` is.
   */
  parsers?: Array<{
    name: string
    options?: object
  }>
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
   * `pluginTs({ enum: { type } })`. `kind` names which factory call `plugin` is: one in `plugins`
   * when left out, the config's `adapter`, or one in `parsers`.
   */
  | { operation: 'set'; config?: ConfigRef; kind?: ExtensionKind; plugin: string; path: Array<string>; value: unknown }
  /**
   * Drop an option so the extension falls back to its default. `kind` as for `set`.
   */
  | { operation: 'remove'; config?: ConfigRef; kind?: ExtensionKind; plugin: string; path: Array<string> }
  /**
   * Add a plugin factory call and its import to the `plugins` array.
   */
  | { operation: 'add-plugin'; config?: ConfigRef; plugin: string; options?: Record<string, unknown> }
  /**
   * Comment the plugin call out, keeping its options in the file so enabling it again restores them.
   */
  | { operation: 'disable-plugin'; config?: ConfigRef; plugin: string }
  /**
   * Uncomment a plugin call a previous `disable-plugin` commented out.
   */
  | { operation: 'enable-plugin'; config?: ConfigRef; plugin: string }

/**
 * A factory call the agent found in a `defineConfig(...)`: a plugin in `plugins`, the `adapter`, or
 * a parser in `parsers`.
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
  /**
   * The `adapter` call, when the entry sets one through an imported factory.
   */
  adapter?: PluginView
  /**
   * The parser calls in `parsers`, when the entry lists any through imported factories.
   */
  parsers?: Array<PluginView>
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
 * Outcome of a single {@link ConfigEdit}, returned in a {@link SaveResult}.
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
 * Per-edit outcomes. `changed` is false when every edit was a no-op, so a caller can skip reloading.
 */
export type SaveResult = { outcomes: Array<ConfigEditOutcome>; changed: boolean }

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
  /**
   * The line to start from (0-based), the `nextCursor` of the previous page. Defaults to 0.
   */
  cursor?: number
  /**
   * Lines to read per file, at most {@link MAX_PAGE_LINES}. Left out, the whole file.
   */
  limit?: number
}

/**
 * Where a paged read stands for one file: the cursor of the next page, `null` after the last one.
 */
export type FilePage = { nextCursor: number | null; totalLines: number }

/**
 * What a file read returns. `pages` is set only for a paged read.
 */
export type ReadFilesResult = { files: Record<string, string>; pages?: Record<string, FilePage> }

/**
 * Asks for one page of a file's line diff between two kept sets, so a large file never leaves the agent whole.
 * `jobId`'s `output` is the newer side, `base` the older one. `cursor` and `limit` page the patch lines.
 */
export type ReadDiffInput = { jobId: string; path: string; base: { jobId: string; source: FileSource }; cursor?: number; limit: number }

/**
 * One hunk of a diff page. A hunk split across pages keeps its `index` and starts, so the pages join back.
 */
export type DiffHunk = { index: number; oldStart: number; newStart: number; lines: Array<string> }

/** One page of a diff. `hasBase` is false, and the page empty, when the base set does not hold the path. */
export type ReadDiffResult = { hunks: Array<DiffHunk>; nextCursor: number | null; hasBase: boolean }

export const DIFF_TOO_LARGE_MESSAGE = 'The two versions differ too much to diff'

/**
 * Asks for the Kubb AST one job parsed its spec into. A job the agent no longer keeps fails with {@link GENERATION_GONE_MESSAGE}.
 */
export type ReadInputInput = { jobId: string }

/**
 * The job's `InputNode`, as JSON. A ref schema names its target, which `input.schemas` holds, without a copy.
 */
export type ReadInputResult = { input: InputNode }

/**
 * The error a file read fails with once the agent no longer keeps the job's files.
 */
export const GENERATION_GONE_MESSAGE = 'The files of this generation are no longer kept on the agent, run the generation again'

export const READ_NOT_ALLOWED_MESSAGE = 'The agent was not granted permission to read generated files'

/** Why `readInput` refuses: reading the parsed spec is its own permission. */
export const READ_AST_NOT_ALLOWED_MESSAGE = 'The agent was not granted permission to read the parsed spec'

export const NO_INPUT_MESSAGE = 'This job kept no API input'

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
 * What Studio knows about the agent on the other end of a socket. Studio passes it with every
 * {@link AgentApi.connect} call, so it stays the authority on whether the agent is a sandbox.
 */
export type AgentConnectInfo = {
  /**
   * A shared `sandbox` or `global` agent. It keeps generations in memory, runs each job in a
   * temporary root, generates from the spec Studio sends, and never writes to disk or edits config.
   */
  sandbox: boolean
  agentSlug: string
  /**
   * Absent for a sandbox or global agent, which belongs to no organization.
   */
  organizationSlug?: string
  studioVersion: string
}

/**
 * Operations Studio invokes on an agent over its socket.
 */
export type AgentApi = {
  /**
   * The first call on every socket, and again whenever Studio needs the current config.
   */
  connect: (info: AgentConnectInfo) => Promise<ConnectMessagePayload>
  startGeneration: (input: GenerateInput) => GenerationRun
  saveConfig: (input: SaveConfigInput) => Promise<SaveResult>
  readFiles: (input: ReadFilesInput) => Promise<ReadFilesResult>
  /**
   * Refused unless the agent was granted `allowRead`, like {@link AgentApi.readFiles}.
   */
  readInput: (input: ReadInputInput) => Promise<ReadInputResult>
  readDiff: (input: ReadDiffInput) => Promise<ReadDiffResult>
}

/**
 * Operations an agent invokes on Studio over its socket.
 */
export type StudioApi = {
  /**
   * Keeps the connection alive. A ping that does not settle in time makes the agent reconnect.
   */
  ping: () => Promise<void>
}

/**
 * Close codes Studio sends when it ends an agent socket on purpose. `UNAUTHORIZED` means the token
 * was refused, so pair again. `SUPERSEDED` and `INCOMPATIBLE` mean stop. Any other code, `1011`
 * included, is an ordinary drop and the agent reconnects.
 */
export const AgentCloseCode = {
  UNAUTHORIZED: 4001,
  SUPERSEDED: 4002,
  INCOMPATIBLE: 4003,
} as const

export const AGENT_SOCKET_PATH = '/api/agent/socket'

/**
 * Optional header naming the process a socket belongs to, for agents that run several processes.
 */
export const AGENT_INSTANCE_HEADER = 'x-kubb-instance-id'

/**
 * How many files a single `readFiles` request may ask for at once.
 */
export const MAX_FILES_PER_REQUEST = 50

/** Most lines one page may ask for. */
export const MAX_PAGE_LINES = 2000

export const MAX_SNAPSHOT_BYTES = 50 * 1024 * 1024

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
   * The agent's project root. This is the workspace that generation runs against.
   */
  root: string
  /**
   * The baseline every generation starts from.
   */
  config: {
    /**
     * The config path as the host gave it, relative to `root` unless absolute.
     */
    path: string
    /**
     * What the agent read out of the config file itself, so Studio can render the plugin editor
     * against the real file. Absent when the agent could not read it, or was not granted
     * `allowConfigEdit`.
     */
    file?: ConfigFileView
    /**
     * Plugins the config registers, with a JSON copy of their options: anything JSON cannot hold,
     * such as a function, is left out. A plugin defined in the project rather than installed as a
     * `@kubb/plugin-*` package keeps its own `name`.
     */
    plugins?: Array<{
      name: string
      options?: object
    }>
    /**
     * The adapter and the parsers the config registers, named like `plugins` and with the same JSON
     * copy of their options, so Studio can render their manifest options.
     */
    adapter?: {
      name: string
      options?: object
    }
    parsers?: Array<{
      name: string
      options?: object
    }>
    /** Installed packages that ship a `kubb-extension.json`, including plugins the config does not use yet. */
    extensions?: Array<ExtensionEntry>
  }
  permissions: AgentPermissions
}

/** An installed extension package and the manifest it ships. */
export type ExtensionEntry = { package: string; version: string; manifest: ExtensionManifest }

/** Installed extension packages by package name, the only ones Studio may import besides `@kubb/plugin-*`. */
export type InstalledExtensions = ReadonlyMap<string, ExtensionEntry>

/**
 * What an agent may do in the project it serves. Every one is off unless the host granted it, and
 * a sandbox narrows them further.
 */
export type AgentPermissions = {
  /**
   * Whether the agent writes generated files to disk. Always false for a sandbox.
   */
  allowWrite: boolean
  /**
   * Whether the agent runs the formatter, the linter, and `output.postGenerate` as child
   * processes after a generation.
   */
  allowExec: boolean
  /**
   * Whether the agent may change plugin options in the user's `kubb.config.ts`. Separate from
   * `allowWrite`, which covers generated output: this one edits a hand-authored source file.
   */
  allowConfigEdit: boolean
  /**
   * Whether the agent hands back file source in response to `readFiles`. Always true for a
   * sandbox.
   */
  allowRead: boolean
  /**
   * Whether the agent hands back the parsed spec (the Kubb AST) in response to `readInput`.
   * Separate from `allowRead`, which covers generated files. Always true for a sandbox.
   */
  allowReadAst: boolean
}

/**
 * Metadata part of `POST /api/snapshots`. The `tarball` part carries the packed package.
 */
export type SnapshotUploadMetadata = {
  /**
   * Stable CI identity, such as `gh:<repoId>:<pr>`. Snapshots with the same `id` share one CI agent.
   */
  id: string
  name: string
  packageName: string
  version: string
  /**
   * The commit the snapshot is built from, so the next one can name it as its base.
   */
  commit?: string
  /**
   * The `id` of another CI agent, such as the base branch's, to also compare with.
   */
  baseId?: string
  /**
   * Content fingerprint per generated file, keyed by path relative to the project root.
   */
  hashes: Record<string, string>
  peerDependencies: Record<string, string>
}

/**
 * How a snapshot's files differ from an earlier snapshot of the same package.
 */
export type SnapshotChanges = {
  /**
   * The snapshot these changes are measured against, `null` when there is none to compare with.
   */
  base: { id: string; version: string | null; commit?: string; createdAt: string } | null
  added: Array<string>
  changed: Array<string>
  removed: Array<string>
}

/**
 * {@link SnapshotChanges} against another CI agent. `baseFound` is `false` when Studio has no CI
 * agent with that id yet, and `true` when it has one without a snapshot of this package.
 */
export type BranchSnapshotChanges = SnapshotChanges & { baseFound: boolean }

/**
 * Response body of `POST /api/snapshots`: `{ snapshot: PublishedSnapshot }`.
 */
export type PublishedSnapshot = {
  id: string
  name: string | null
  version: string | null
  integrity: string | null
  agent: { id: string; name: string; slug: string | null }
  /**
   * Readable download path, often `/packages/{agentSlug}/{name}.tgz`.
   */
  url: string
  snapshotIdUrl: string
  createdAt: string
  expiresAt: string
  /**
   * What changed since the previous snapshot of this package on the same CI agent.
   */
  changes?: SnapshotChanges
  /**
   * What differs from the latest snapshot of the CI agent `baseId` names. Absent without a base.
   */
  branchChanges?: BranchSnapshotChanges
}
