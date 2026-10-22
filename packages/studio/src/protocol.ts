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
   * Raw OpenAPI / Swagger spec content (YAML or JSON string), never a file path.
   * Required by a 'sandbox' agent, which has no disk config of its own and refuses anything else.
   * A 'managed' agent also takes a URL or a `git+<repo>#<ref>:<path>` input, and falls back to its disk config without one.
   * Any other agent always reads its spec from disk, so this is ignored with a `kubb:warn`.
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
  /**
   * Which `defineConfig(...)` entry to generate from. Omitted runs the first one.
   */
  config?: ConfigRef
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
   *
   * An object option that holds code in only some members, such as
   * `output: { path: './gen', banner: () => '' }`, also carries `value` with its literal members
   * and `locked` with the paths of the members that are code, relative to the option
   * (`[['banner']]`). A `set` at any deeper path outside `locked` succeeds, so Studio can edit
   * `output.path` there.
   */
  options: Record<string, { literal: boolean; value?: OptionValue; locked?: Array<Array<string>> }>
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
 * watching several runs can tell them apart. `requestedBy` names the Studio user in the agent's
 * command log, and Studio leaves it out for a shared agent.
 */
export type GenerateInput = {
  jobId: string
  config: JSONKubbConfig
  /**
   * Display name of the Studio user who asked for the run, shown in the agent's job log.
   */
  requestedBy?: string
}

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
}

/**
 * Asks the agent to apply a batch of edits to the config file on disk. `requestedBy` as for {@link GenerateInput}.
 */
export type SaveConfigInput = {
  edits: Array<ConfigEdit>
  /**
   * Display name of the Studio user who asked for the save, shown in the agent's job log.
   */
  requestedBy?: string
}

/**
 * Per-edit outcomes. `changed` is false when every edit was a no-op, so a caller can skip reloading.
 */
export type SaveResult = { outcomes: Array<ConfigEditOutcome>; changed: boolean }

/**
 * Asks the agent to install an extension from the registry with `kubb add`. `requestedBy` as for {@link GenerateInput}.
 */
export type InstallExtensionInput = {
  /**
   * The registry id: `owner/slug`, or a bare `slug` for an official extension.
   */
  id: string
  requestedBy?: string
}

/**
 * `installed` is false when the agent refused or `kubb add` failed, with `reason` saying why.
 */
export type InstallExtensionResult = { installed: boolean; reason?: string }

/**
 * Reads an immutable output set kept on disk, from a generation or the initial connection.
 */
export type ReadFilesInput = {
  jobId: string
  paths: Array<string>
  cursor?: number
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
export type ReadDiffInput = { jobId: string; path: string; base: { jobId: string }; cursor?: number; limit: number }

/**
 * One hunk of a diff page, with its `@@` header. Pages hold whole hunks, and only a hunk longer than a page is
 * split: its parts keep `index` and the header.
 */
export type DiffHunk = { index: number; oldStart: number; oldLines: number; newStart: number; newLines: number; lines: Array<string> }

/**
 * The size of the whole diff, sent with every page, so a viewer can summarize it before reading every page.
 */
export type DiffStats = {
  additions: number
  deletions: number
  hunks: number
  /**
   * Patch lines in all hunks, the range `cursor` pages through.
   */
  lines: number
  /**
   * True when part of the diff ran out of time and shows as one block that replaces those lines.
   */
  coarse: boolean
}

/**
 * One page of a diff. `hasBase` is false, and the page empty, when the base set does not hold the path.
 */
export type ReadDiffResult = { hunks: Array<DiffHunk>; nextCursor: number | null; hasBase: boolean; stats: DiffStats }

/**
 * Asks for the Kubb AST one job parsed its spec into. A job the agent no longer keeps fails with {@link AgentMessage.GENERATION_GONE}.
 */
export type ReadInputInput = { jobId: string }

/**
 * The job's `InputNode`, as JSON. A ref schema names its target, which `input.schemas` holds, without a copy.
 */
export type ReadInputResult = { input: InputNode }

/**
 * Why the agent refuses a request. Studio matches on these to answer with the right status.
 */
export const AgentMessage = {
  GENERATION_IN_PROGRESS: 'A generation is already in progress, please wait for it to finish',
  SANDBOX_INPUT_ONLY: 'A sandbox agent generates only from the OpenAPI document content Studio sends, not from a file path or URL',
  MANAGED_INPUT_KIND: 'A managed agent generates from the OpenAPI document content, a URL, or a git file that Studio sends, not from a file path',
  CONFIG_ENTRY_NOT_FOUND: 'The config file has no entry at that position or with that name',
  JOB_REQUIRED: 'The request must name a job',
  FILE_REQUEST_INVALID: 'The request must name an output set and carry paths',
  TOO_MANY_FILES: 'Too many paths were requested at once',
  INVALID_PAGE: 'The requested file page is invalid',
  DIFF_REQUEST_INVALID: 'The request must name a job, a base, and a path',
  HASHES_ONLY: 'This agent kept only the hashes of that job',
  /**
   * A read for a job whose files the agent no longer keeps.
   */
  GENERATION_GONE: 'The files of this generation are no longer kept on the agent, run the generation again',
  READ_NOT_ALLOWED: 'The agent was not granted permission to read generated files',
  /**
   * Reading the parsed spec is its own permission.
   */
  READ_AST_NOT_ALLOWED: 'The agent was not granted permission to read the parsed spec',
  NO_INPUT: 'This job kept no API input',
} as const
export type AgentMessage = (typeof AgentMessage)[keyof typeof AgentMessage]

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
   * A shared `sandbox` or `global` agent. It keeps generations on temporary disk, runs each job in a
   * temporary root, and generates from the spec Studio sends without editing a project or its config.
   */
  sandbox: boolean
  /**
   * A `managed` agent Studio hosts for the organization. It has no project spec on disk, so it
   * may generate from a spec Studio sends: the content, a URL, or a git file.
   */
  managed?: boolean
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
  /**
   * Refused unless the agent was granted `allowInstall` and `allowConfigEdit`. An agent from before
   * `installExtension` rejects the call.
   */
  installExtension: (input: InstallExtensionInput) => Promise<InstallExtensionResult>
  readFiles: (input: ReadFilesInput) => Promise<ReadFilesResult>
  /**
   * Refused unless the agent was granted `allowRead`, like {@link AgentApi.readFiles}.
   */
  readInput: (input: ReadInputInput) => Promise<ReadInputResult>
  /**
   * Refused unless the agent was granted `allowRead`, like {@link AgentApi.readFiles}.
   */
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
    /** Installed packages that ship a `kubb-extension.json`, including plugins the config does not use yet. */
    extensions?: Array<ExtensionEntry>
    /** Every entry the config exports, in source order. */
    configs: Array<ConfigEntryView>
  }
  permissions: AgentPermissions
}

export type DiskOutput = {
  jobId: string
  files: Array<string>
  hashes: Record<string, string>
}

/**
 * One `defineConfig(...)` entry as the agent runs it. Every option is a JSON copy: anything JSON cannot
 * hold, such as a function, is left out. A plugin defined in the project keeps its own `name`.
 */
export type ConfigEntryView = {
  name?: string
  /** The input file path or URL, without credentials. Omitted for an inline or parsed document. */
  input?: string
  /** The output directory as the entry gives it, relative to the project root unless absolute. */
  output: string
  /**
   * The output directory's current file list, readable through `readFiles` without generating.
   * Absent for a sandbox or when the host has not granted `allowRead`.
   */
  disk?: DiskOutput
  plugins: Array<{
    name: string
    options?: object
  }>
  adapter?: {
    name: string
    options?: object
  }
  parsers: Array<{
    name: string
    options?: object
  }>
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
   * Whether the agent may install an extension from the registry into the project with `kubb add`,
   * which also adds a plugin to `kubb.config.ts`. Needs `allowConfigEdit` as well.
   */
  allowInstall: boolean
  /**
   * Whether the agent shares existing output on connect and hands back file source through
   * `readFiles`. A sandbox always permits reads of its generated files.
   */
  allowRead: boolean
  /**
   * Whether the agent hands back the parsed spec (the Kubb AST) in response to `readInput`.
   * Separate from `allowRead`, which covers generated files. Always true for a sandbox.
   */
  allowReadAst: boolean
}

/**
 * The keys of {@link AgentPermissions}, such as the permission a refused request names.
 */
export const AgentPermission = {
  READ: 'allowRead',
  READ_AST: 'allowReadAst',
  WRITE: 'allowWrite',
  CONFIG_EDIT: 'allowConfigEdit',
  INSTALL: 'allowInstall',
  EXEC: 'allowExec',
} as const satisfies Record<string, keyof AgentPermissions>
export type AgentPermission = (typeof AgentPermission)[keyof typeof AgentPermission]

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
  base: { id: string; version: string | null; commit?: string; createdAt: string; number?: number } | null
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
  /**
   * Studio page of this snapshot, such as `/kubb-labs/petstore/182`. Absent from a Studio that does not send it.
   */
  webUrl?: string
  /**
   * The snapshot's sequence number on its CI agent, shown as `#182`. Absent from a Studio that does not send it.
   */
  number?: number
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
