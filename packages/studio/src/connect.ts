import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { getErrorMessage, mkdtemp, read, rm, toError } from '@internals/utils'
import {
  Diagnostics,
  cacheStorage,
  checkoutGitInput,
  type Config,
  fsStorage,
  getInputKind,
  type InputKind,
  Hookable,
  type KubbHooks,
  type ProblemCode,
  type Storage,
  readInstalledPackages,
  resolveCacheDir,
  resolveMeta,
} from '@kubb/core'
import { newWebSocketRpcSession, RpcTarget } from 'capnweb'
import { x } from 'tinyexec'
import { version as kubbVersion } from '../package.json'
import { BUNDLED_PACKAGES, editConfigFile, pickOutput, readConfig, readImports } from '@internals/shared'
import { diffHunks, pageHunks } from './diff.ts'
import { createGenerationStream } from './generationEvents.ts'
import { createGenerationStore, generate, type GenerationStore, listDisk, resolveGenerationLimits } from './generations.ts'
import {
  AGENT_INSTANCE_HEADER,
  AGENT_SOCKET_PATH,
  type AgentApi,
  AgentPermission,
  AgentCloseCode,
  AgentMessage,
  type AgentConnectInfo,
  type AgentPermissions,
  type ConfigEdit,
  ConfigEditOperation,
  type ConfigEntryView,
  type ConfigFileView,
  type ConfigRef,
  type ConnectMessagePayload,
  type DiskOutput,
  type GenerateInput,
  type GenerateResult,
  type GenerationEvent,
  type GenerationRun,
  type InstalledExtensions,
  MAX_FILES_PER_REQUEST,
  MAX_PAGE_LINES,
  type ReadDiffInput,
  type ReadDiffResult,
  type ReadFilesInput,
  type ReadFilesResult,
  type ReadInputInput,
  type ReadInputResult,
  type InstallExtensionInput,
  type InstallExtensionResult,
  type RemoveExtensionInput,
  type RemoveExtensionResult,
  type SaveConfigInput,
  type SaveResult,
  type StudioApi,
  type UpdateExtensionsInput,
  type UpdateExtensionsResult,
} from './protocol.ts'
import { withPublicFetch } from './publicFetch.ts'
import { assertOutputPaths, mergeAdapter, mergeOutput, mergeParsers, mergePlugins, toJSONOptions, toStudioName } from './resolveConfig.ts'
import { defaultStudioUrl, secureUrl } from './url.ts'

const HEARTBEAT_INTERVAL_MS = 30_000
// Studio marks an agent offline after its liveness window, so a slower cadence would look dead.
const MAX_HEARTBEAT_INTERVAL_MS = 60_000
const PING_TIMEOUT_MS = 10_000
const OPEN_TIMEOUT_MS = 5_000
const MAX_RETRY_DELAY_MS = 30_000
const DISK_SNAPSHOT_MAX_FILES = 10_000
// Sandboxes keep temporary output sets with a short lifetime.
const SANDBOX_GENERATION_TTL_MS = 15 * 60_000
// What Studio may send a managed agent as its spec. Not `file` or `object`: a path would read the container's disk.
const MANAGED_INPUT_KINDS = new Set<InputKind>(['inline', 'url', 'git'])

/**
 * Studio closed with {@link AgentCloseCode.UNAUTHORIZED}. Hosts forget the token and pair again.
 */
export class InvalidAgentTokenError extends Error {
  constructor(studioUrl: string) {
    super(`Kubb Studio rejected this agent's token. It expired or was revoked, or the agent was deleted in ${studioUrl}.`)
    this.name = 'InvalidAgentTokenError'
  }
}

/**
 * Studio closed with {@link AgentCloseCode.INCOMPATIBLE}. Only an upgrade helps.
 */
export class IncompatibleAgentError extends Error {
  constructor({ studioUrl, detail }: { studioUrl: string; detail?: string }) {
    super(`Kubb Studio at ${studioUrl} requires a newer agent${detail ? `: ${detail}` : ''}. Upgrade kubb or the Kubb agent image.`)
    this.name = 'IncompatibleAgentError'
  }
}

export type StudioConnectedContext = AgentConnectInfo & {
  url: string
  /**
   * The Studio, runtime, and host versions, so a host can show a mismatch.
   */
  versions: { studio: string; kubb: string; agent: string }
}

declare global {
  namespace Kubb {
    interface KubbHooksRegistry {
      /**
       * Fired after each handshake, including reconnects.
       */
      'studio:connected': [ctx: StudioConnectedContext]
      'studio:disconnected': [ctx: { code: number; reason: string }]
      'studio:reconnecting': [ctx: { delayMs: number }]
      /**
       * A finished command and what it did, such as `applied 2/3 edits to kubb.config.ts`.
       */
      'studio:command': [
        ctx: {
          command: 'generate' | 'saveConfig' | 'installExtension' | 'updateExtensions' | 'removeExtension' | 'readFiles' | 'readInput' | 'readDiff'
          info: string
          /**
           * The Studio user who asked for the command, when Studio names one.
           */
          requestedBy?: string
          /**
           * Set when a generation failed. Its diagnostics went out through `kubb:generation:end`.
           */
          failed?: boolean
        },
      ]
      /**
       * A refused or ignored request, with the missing permission so the host can add a remedy.
       */
      'studio:warn': [ctx: { message: string; permission?: AgentPermission }]
      'studio:error': [ctx: { error: Error }]
    }
  }
}

export type ConnectAgentOptions = {
  /**
   * The agent's bearer token, from {@link pairAgent}.
   */
  token: string
  studioUrl?: string
  /**
   * The config path shown in Studio, relative to `root` unless absolute.
   */
  configPath: string
  /**
   * Called for every handshake and every generation, so edits on disk show up. One entry per
   * `defineConfig(...)` entry, and a generation names the one it runs.
   */
  loadConfigs: () => Promise<Array<Config>>
  /**
   * The host's own version, reported to Studio next to the runtime's.
   */
  version: string
  /**
   * The project root generation runs against.
   * @default process.cwd()
   */
  root?: string
  /**
   * What Studio may do in this project. Every permission is off unless granted.
   */
  permissions?: Partial<AgentPermissions>
  /** The CLI entry `installExtension` runs `kubb add` with. Found through the project's `kubb` or `@kubb/cli` dependency when omitted. */
  kubbBin?: string
  /**
   * Receives the `studio:*` hooks and the `kubb:*` hooks of every generation.
   */
  hooks?: Hookable<KubbHooks>
  signal?: AbortSignal
  /**
   * Longest wait between reconnect attempts, in milliseconds.
   * @default 30000
   */
  maxRetryDelay?: number
  /**
   * Milliseconds between keep-alive pings, at most 60000.
   * @default 30000
   */
  heartbeatInterval?: number
}

type ResolvedOptions = Required<Omit<ConnectAgentOptions, 'signal' | 'kubbBin'>> & {
  signal?: AbortSignal
  kubbBin?: string
  permissions: AgentPermissions
  configFile: string
}

type Rpc = { studio: StudioApi; closed: Promise<{ code: number; reason: string }>; close: () => void }

// Tests swap in an in-process pair.
export type OpenRpc = (input: { url: URL; token: string; instanceId: string; agent: AgentApi }) => Rpc

type Session = {
  info?: AgentConnectInfo
  connected: PromiseWithResolvers<AgentConnectInfo>
  closed: boolean
  active?: { jobId: string; abort: () => void; settled: Promise<void> }
  install?: { abort: () => void; settled: Promise<void> }
  saving?: boolean
}

const INSTALL_TIMEOUT_MS = 5 * 60_000
/** How many trailing lines of a failed `kubb add` the reason keeps. */
const INSTALL_OUTPUT_LINES = 20
/** `owner/slug` or `slug`, as `kubb add` takes it. Checked before it becomes an argument. */
const REGISTRY_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?$/

/** The CLI the project depends on, so `kubb add` installs next to what the config imports. */
function findKubbBin(root: string): string | undefined {
  const requireModule = createRequire(path.resolve(root, 'package.json'))
  const names = ['kubb', '@kubb/cli']
  // Nearest directory first, so a nested project does not pick up an ancestor's CLI.
  return (requireModule.resolve.paths('kubb') ?? [])
    .flatMap((dir) => names.map((name) => path.join(dir, name, 'bin', 'kubb.js')))
    .find((bin) => existsSync(bin))
}

/** Runs a `kubb` command without a shell, and keeps the end of its output for the failure reason. */
async function runKubb({ bin, args, cwd, signal }: { bin: string; args: Array<string>; cwd: string; signal: AbortSignal }) {
  try {
    const { stdout, stderr, exitCode } = await x(process.execPath, [bin, ...args], {
      signal,
      timeout: INSTALL_TIMEOUT_MS,
      throwOnError: false,
      nodeOptions: { cwd, env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' } },
    })
    const output = `${stdout}\n${stderr}`.trim().split('\n').slice(-INSTALL_OUTPUT_LINES).join('\n')
    return { failed: exitCode !== 0, output: output || `kubb ${args[0]} exited with ${exitCode ?? 'a signal'}` }
  } catch (error) {
    // tinyexec still throws when the timeout hits or the process cannot start.
    return { failed: true, output: `kubb ${args[0]} did not run: ${getErrorMessage(error)}` }
  }
}

// A throwing host listener must not break the connection.
function emit<TName extends keyof KubbHooks & string>(hooks: Hookable<KubbHooks>, name: TName, ...args: KubbHooks[TName]): Promise<void> {
  return Promise.resolve(hooks.callHook(name, ...args)).catch(() => {})
}

function isValidPage({ cursor, limit }: Pick<ReadFilesInput, 'cursor' | 'limit'>): boolean {
  if (limit === undefined) return cursor === undefined
  if (cursor !== undefined && (!Number.isSafeInteger(cursor) || cursor < 0)) return false
  return Number.isSafeInteger(limit) && limit >= 1 && limit <= MAX_PAGE_LINES
}

/**
 * Maps generated paths into a temporary directory while keeping the project root for input resolution.
 */
function stagingStorage({ root, directory }: { root: string; directory: string }): Storage {
  const storage = fsStorage()
  const target = (key: string) => {
    const relative = path.relative(root, path.resolve(root, key))
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('Output path escapes the project root')
    return path.join(directory, relative)
  }
  return {
    name: 'fs',
    readItem: (key) => storage.readItem(target(key)),
    writeItem: (key, value) => storage.writeItem(target(key), value),
    removeItem: (key) => storage.removeItem(target(key)),
    readKeys: (base) => storage.readKeys(base ? target(base) : directory),
    empty: (base) => (base ? storage.empty(target(base)) : Promise.resolve()),
  }
}

type RunHandle = { stream: ReadableStream<GenerationEvent>; result: Promise<GenerateResult>; stop: () => void }

class GenerationRunTarget extends RpcTarget implements GenerationRun {
  readonly #run: RunHandle

  constructor(run: RunHandle) {
    super()
    this.#run = run
  }

  async events() {
    return this.#run.stream
  }
  result() {
    return this.#run.result
  }
  async cancel() {
    this.#run.stop()
  }
  // Cap'n Web also calls this when the peer session is torn down, so a dropped socket stops the run.
  [Symbol.dispose]() {
    this.#run.stop()
  }
}

/** A save's edit once a `set-input` document is named, or why it was refused. */
type KeptEdit = (ConfigEdit & { document?: { fileName: string; text: string } }) | { reason: string }

// Cap'n Web exposes only prototype methods, so the public methods are exactly `AgentApi`.
class Agent extends RpcTarget implements AgentApi {
  readonly #options: ResolvedOptions
  readonly #session: Session
  readonly #limits = resolveGenerationLimits()
  #store: GenerationStore | undefined
  readonly #sandboxCacheRoot = path.join(tmpdir(), `kubb-studio-${randomUUID()}`)
  // Kept sets never change, so a diff is computed once and its pages are cut from it.
  readonly #diffs = new Map<string, ReturnType<typeof diffHunks>>()

  constructor({ options, session }: { options: ResolvedOptions; session: Session }) {
    super()
    this.#options = options
    this.#session = session
  }

  get #sandbox(): boolean {
    return this.#session.info?.sandbox === true
  }

  get #managed(): boolean {
    return this.#session.info?.managed === true
  }

  // A sandbox has no project to write to or edit, and Studio may always read what it generated there.
  get #permissions(): AgentPermissions {
    const { permissions } = this.#options
    return this.#sandbox
      ? {
          ...permissions,
          allowWrite: false,
          allowConfigEdit: false,
          allowInstall: false,
          allowUpdate: false,
          allowRemove: false,
          allowSaveInput: false,
          allowRead: true,
          allowReadAst: true,
        }
      : permissions
  }

  // Owned agents retain output in the project cache. Each sandbox connection has a temporary cache.
  get #generations(): GenerationStore {
    this.#store ??= createGenerationStore({
      storage: cacheStorage({ root: this.#sandbox ? this.#sandboxCacheRoot : this.#options.root }),
      maxCount: this.#limits.maxCount,
      maxMb: this.#limits.maxMb,
      ttlMs: this.#sandbox ? SANDBOX_GENERATION_TTL_MS : undefined,
    })
    return this.#store
  }

  async clear() {
    if (this.#sandbox) await rm(resolveCacheDir(this.#sandboxCacheRoot), { recursive: true, force: true })
  }

  #warn({ message, permission }: { message: string; permission?: AgentPermission }): Promise<void> {
    return emit(this.#options.hooks, 'studio:warn', { message, permission })
  }

  // Studio shows the thrown message, and the host logs the same text.
  async #refuse({
    message,
    permission,
    code = Diagnostics.code.unknown,
  }: {
    message: string
    permission?: AgentPermission
    code?: ProblemCode
  }): Promise<never> {
    await this.#warn({ message, permission })
    throw new Diagnostics.Error({ code, severity: 'error', message })
  }

  #assertConnected(): void {
    if (!this.#session.info)
      throw new Diagnostics.Error({ code: Diagnostics.code.internalError, severity: 'error', message: 'Studio must call connect() before any other command' })
  }

  #logCommand(command: KubbHooks['studio:command'][0]['command'], info: string, requestedBy?: string, failed?: boolean): Promise<void> {
    return emit(this.#options.hooks, 'studio:command', { command, info, requestedBy, failed })
  }

  // Not cached: the user can edit the file between two Studio actions.
  async #readConfigFileView(source: Promise<string>): Promise<ConfigFileView | undefined> {
    if (!this.#permissions.allowConfigEdit) return undefined

    try {
      return readConfig(await source)
    } catch (error) {
      await this.#warn({ message: `Could not read ${this.#options.configFile}: ${getErrorMessage(error)}` })
      return undefined
    }
  }

  // Not cached either: the user can install a plugin while the agent runs. Keeps each project
  // dependency, config import and built-in that resolves and ships a valid `kubb-extension.json`.
  async #installedExtensions(source = read(this.#options.configFile)): Promise<InstalledExtensions> {
    const imports = await source.then(readImports, () => [])
    const installed = await readInstalledPackages({ root: this.#options.root, packages: [...imports, ...BUNDLED_PACKAGES], resolveFrom: ['kubb'] })

    return new Map(
      installed.flatMap(({ package: name, version, manifest }) =>
        version !== undefined && manifest
          ? [[name, { package: name, version, manifest, ...(BUNDLED_PACKAGES.includes(name) ? { bundled: true as const } : {}) }] as const]
          : [],
      ),
    )
  }

  async connect(info: AgentConnectInfo): Promise<ConnectMessagePayload> {
    this.#session.info = info
    const { configPath, root, version, loadConfigs, configFile } = this.#options
    const source = read(configFile)
    const [configs, file, extensions] = await Promise.all([loadConfigs(), this.#readConfigFileView(source), this.#installedExtensions(source)])
    // Copied through JSON: Cap'n Web would otherwise pass every function in the options as a stub
    // Studio could call, running the user's config code in this process.
    const entries: Array<ConfigEntryView> = []
    for (const config of configs) {
      const disk = await this.#readDiskOutput(config).catch(async (error: unknown) => {
        await this.#warn({ message: `Could not read the output directory: ${getErrorMessage(error)}` })
        return undefined
      })
      entries.push({ ...toEntryView(config, extensions), ...(disk && { disk }) })
    }
    this.#session.connected.resolve(info)

    return {
      versions: { kubb: kubbVersion, agent: version },
      root,
      config: { path: configPath, file, extensions: [...extensions.values()], configs: entries },
      permissions: this.#permissions,
    }
  }

  async #readDiskOutput(config: Config): Promise<DiskOutput | undefined> {
    if (this.#sandbox || !this.#permissions.allowRead || this.#session.active) return undefined
    const files = await listDisk({ root: this.#options.root, outputPath: config.output.path, maxFiles: DISK_SNAPSHOT_MAX_FILES })
    if (!files) return undefined

    const { jobId, output } = await this.#generations.keepInitial(files)
    return { jobId, files: output.paths, hashes: output.hashes }
  }

  startGeneration(input: GenerateInput): GenerationRun {
    const stream = createGenerationStream(this.#options.hooks, input.jobId)
    const controller = new AbortController()
    const result = this.#runGeneration(input, controller).then(
      (value) => stream.close().then(() => value),
      (error: unknown) => {
        stream.fail(error)
        throw error
      },
    )
    // A disconnect can reject this after the remote caller disappeared.
    void result.catch(() => {})

    return new GenerationRunTarget({
      stream: stream.stream,
      result,
      stop: () => {
        controller.abort(new Error('Generation canceled'))
        stream.fail()
      },
    })
  }

  /**
   * Keeps a job's output and permitted parsed input, then cleans up its temporary generation directories.
   */
  async #runGeneration(input: GenerateInput, controller: AbortController): Promise<GenerateResult> {
    this.#assertConnected()
    // Checked before the first `await`, so two calls in the same tick can't both pass.
    if (this.#session.closed) throw new Diagnostics.Error({ code: Diagnostics.code.internalError, severity: 'error', message: 'Connection is closed' })
    if (this.#session.active) return this.#refuse({ message: AgentMessage.GENERATION_IN_PROGRESS })
    if (this.#session.install) return this.#refuse({ message: AgentMessage.INSTALL_IN_PROGRESS })
    if (this.#session.saving) return this.#refuse({ message: AgentMessage.SAVE_IN_PROGRESS })
    const settled = Promise.withResolvers<void>()
    this.#session.active = { jobId: input.jobId, abort: () => controller.abort(new Error('Generation canceled')), settled: settled.promise }
    let root = this.#options.root
    let outputRoot: string | undefined

    try {
      // Kubb keys its manifest cache by root, so sandbox tenants sharing one root would read each other's.
      if (this.#sandbox) root = await mkdtemp(path.join(tmpdir(), 'kubb-job-'))
      if (!this.#sandbox && !this.#permissions.allowWrite) outputRoot = await mkdtemp(path.join(tmpdir(), 'kubb-output-'))
      return await this.#generate({ input, root, outputRoot, signal: controller.signal })
    } finally {
      if (root !== this.#options.root) {
        await Promise.all([rm(root, { recursive: true, force: true }), rm(resolveCacheDir(root), { recursive: true, force: true })]).catch(() => {})
      }
      if (outputRoot) await rm(outputRoot, { recursive: true, force: true })
      this.#session.active = undefined
      settled.resolve()
    }
  }

  /**
   * Merges Studio's config over the project config and confines generation to the configured output folder.
   */
  async #generate({
    input,
    root,
    outputRoot,
    signal,
  }: {
    input: GenerateInput
    root: string
    outputRoot?: string
    signal: AbortSignal
  }): Promise<GenerateResult> {
    const { jobId, config: patch } = input
    // A sandbox has no spec on disk, so it only ever generates from the content Studio sends. A path
    // or URL would make it read host files or fetch internal addresses on behalf of any tenant.
    const studioInput = this.#sandbox || this.#managed ? patch?.input : undefined
    if (this.#sandbox && (typeof studioInput !== 'string' || !studioInput.trim() || getInputKind(studioInput) !== 'inline')) {
      return this.#refuse({ message: AgentMessage.SANDBOX_INPUT_ONLY })
    }
    // Studio may point a managed agent at a URL or a git file, and it falls back to its config's input without one. A file path would read the container's disk.
    if (this.#managed && studioInput !== undefined && !MANAGED_INPUT_KINDS.has(getInputKind(studioInput))) {
      return this.#refuse({ message: AgentMessage.MANAGED_INPUT_KIND })
    }

    const [configs, extensions] = await Promise.all([this.#options.loadConfigs(), this.#installedExtensions()])
    const config = pickConfig(configs, patch?.config)
    if (!config) return this.#refuse({ message: AgentMessage.CONFIG_ENTRY_NOT_FOUND })
    const [plugins, adapter, parsers] = await Promise.all([
      mergePlugins({ diskPlugins: config.plugins, studioPlugins: patch?.plugins, extensions }).then((merged) => {
        assertOutputPaths({ plugins: merged ?? [], diskPlugins: config.plugins, root, outputPath: config.output.path })
        return merged
      }),
      mergeAdapter(config.adapter, patch?.adapter, extensions),
      mergeParsers({ diskParsers: config.parsers, studioParsers: patch?.parsers, extensions }),
    ]).catch(async (error: unknown) => {
      // Thrown before core runs, so nothing else reports it to the host.
      await emit(this.#options.hooks, 'kubb:error', { error: toError(error) })
      throw error
    })

    const activePlugins = plugins ?? config.plugins

    if (patch?.input && !this.#sandbox && !this.#managed) {
      // A `kubb:warn` rather than `studio:warn`, so the generation's event stream carries it to Studio too.
      await emit(this.#options.hooks, 'kubb:warn', {
        message: 'Ignored the spec from Studio: generating from a Studio spec is only available to a sandbox or managed agent',
      })
    }

    // A managed agent checks a git input out itself, so the fetch stays on public addresses and follows no redirect.
    const checkout =
      this.#managed && studioInput !== undefined && getInputKind(studioInput) === 'git'
        ? await checkoutGitInput(studioInput, signal, { publicOnly: true, authorization: input.gitAuth?.authorization }).catch((error: unknown) =>
            this.#refuse({ message: getErrorMessage(error), code: Diagnostics.code.gitInputFailed }),
          )
        : undefined
    const run = () =>
      generate({
        config: {
          ...config,
          root,
          input: checkout?.path ?? studioInput ?? config.input,
          output: mergeOutput({ output: config.output, studio: patch?.output }),
          storage: outputRoot ? stagingStorage({ root, directory: outputRoot }) : fsStorage(),
          plugins: activePlugins,
          adapter,
          parsers,
        },
        hooks: this.#options.hooks,
        signal,
        allowExec: this.#permissions.allowWrite && this.#permissions.allowExec,
      })
    // The adapter fetches the URL and every `$ref` in it, so a managed agent limits the fetch itself to public addresses.
    const files = await (this.#managed ? withPublicFetch(run) : run())
      .catch(async (error: unknown) => {
        await this.#generations.drop(jobId)
        await this.#logCommand('generate', getErrorMessage(error), input.requestedBy, true)
        throw error
      })
      .finally(() => checkout?.dispose())

    const output = await this.#generations.keep({ jobId, files, maxSetMb: this.#limits.maxMb })
    // Only `readInput` reads it, which needs `allowReadAst`.
    const inputBytes = await this.#generations.keepInput({ jobId, input: this.#permissions.allowReadAst ? files.input : null, maxSetMb: this.#limits.maxMb })
    if (!output.paths.length && Object.keys(output.hashes).length) {
      await this.#warn({ message: 'Kept only the hashes of this generation: its output is too large to keep' })
    }
    await this.#generations.add({ jobId, output, inputBytes })
    await this.#logCommand(
      'generate',
      `${activePlugins.length} plugin${activePlugins.length === 1 ? '' : 's'}, ${this.#permissions.allowWrite ? 'written to disk' : 'staged on disk'}${studioInput !== undefined ? ', from a Studio spec' : ''}`,
      input.requestedBy,
    )

    return {
      status: 'success',
      files: [...files.paths],
      fileCount: files.paths.size,
      hashes: output.hashes,
    }
  }

  async saveConfig(input: SaveConfigInput): Promise<SaveResult> {
    this.#assertConnected()
    const { configPath, configFile } = this.#options

    if (!Array.isArray(input.edits)) {
      await this.#warn({ message: 'Ignored save: the message carried no edits' })
      return { outcomes: [], changed: false }
    }

    const edits = input.edits
    const refuse = (reason: string): SaveResult => ({ outcomes: edits.map((edit) => ({ edit, applied: false, reason })), changed: false })

    if (!this.#permissions.allowConfigEdit) {
      await this.#warn({ message: 'Ignored save: editing kubb.config.ts was not granted' })
      return refuse('the agent was not granted permission to edit kubb.config.ts')
    }

    // A running generation reloads the config, so it would see half the change.
    const busy = this.#busy()
    if (busy) return refuse(busy)

    // Keeps `kubb add` from rewriting the config while this save is still writing it.
    this.#session.saving = true
    try {
      const kept: Array<KeptEdit> = []
      for (const edit of edits) kept.push(await this.#keepInput(edit))
      const written = await editConfigFile({
        filePath: configFile,
        edits: kept.flatMap((edit) => ('reason' in edit ? [] : [edit])),
        extensions: await this.#installedExtensions(),
      })
      let next = 0
      // Back in the order Studio sent them, each naming the edit as sent rather than the document's file.
      const outcomes = kept.map((edit, index) =>
        'reason' in edit ? { edit: edits[index]!, applied: false, reason: edit.reason } : { ...written.outcomes[next++]!, edit: edits[index]! },
      )
      // A document is written only once its config edit applied, in edit order, so the last edit for a file wins.
      let wroteDocument = false
      for (const [index, edit] of kept.entries()) {
        if (!('document' in edit) || !edit.document || !outcomes[index]!.applied) continue
        await writeFile(path.join(this.#options.root, edit.document.fileName), edit.document.text, 'utf-8')
        wroteDocument = true
      }
      const changed = written.changed || wroteDocument
      const applied = outcomes.filter((outcome) => outcome.applied).length
      await this.#logCommand('saveConfig', `applied ${applied}/${outcomes.length} edits to ${configPath}`, input.requestedBy)

      return { outcomes, changed }
    } catch (error) {
      // Refuse every edit so Studio hears back instead of waiting.
      await emit(this.#options.hooks, 'studio:error', { error: toError(error) })
      return refuse(getErrorMessage(error))
    } finally {
      this.#session.saving = false
    }
  }

  /**
   * Readies a `set-input` edit for the config file: a document is pointed at `openapi.yaml` (`openapi.json`
   * for JSON) in the project, one file per config entry, for `saveConfig` to write once the edit applies.
   * A managed agent refuses a file path, as in a generation.
   */
  async #keepInput(edit: ConfigEdit): Promise<KeptEdit> {
    // A blank input goes on unchanged, so the config writer refuses it before any file is written.
    if (edit?.operation !== ConfigEditOperation.SET_INPUT || typeof edit.input !== 'string' || !edit.input.trim()) return edit
    if (!this.#permissions.allowSaveInput) {
      await this.#warn({ message: 'Ignored the spec to save: saving the input was not granted', permission: AgentPermission.SAVE_INPUT })
      return { reason: 'the agent was not granted permission to save the input' }
    }
    const kind = getInputKind(edit.input)
    if (this.#managed && !MANAGED_INPUT_KINDS.has(kind)) return { reason: AgentMessage.MANAGED_INPUT_KIND }
    if (kind !== 'inline') return edit

    const entry = edit.config === undefined || edit.config === 0 ? '' : `-${String(edit.config).replace(/[^\w.-]/g, '-')}`
    const fileName = `openapi${entry}.${isJson(edit.input) ? 'json' : 'yaml'}`
    return { ...edit, input: `./${fileName}`, document: { fileName, text: edit.input } }
  }

  /**
   * Installs a registry extension into the project with `kubb add <id> --yes`, which also adds a
   * plugin to `kubb.config.ts`. Studio calls `connect()` again afterwards to see the result.
   */
  async installExtension(input: InstallExtensionInput): Promise<InstallExtensionResult> {
    this.#assertConnected()
    const { root, configFile, kubbBin = findKubbBin(root) } = this.#options
    const refuse = async (reason: string, permission?: AgentPermission): Promise<InstallExtensionResult> => {
      await this.#warn({ message: `Ignored install: ${reason}`, permission })
      return { installed: false, reason }
    }

    if (typeof input?.id !== 'string' || !REGISTRY_ID.test(input.id)) return refuse('the message carried no registry id')
    if (!this.#permissions.allowInstall) return refuse('installing extensions was not granted', AgentPermission.INSTALL)
    if (!this.#permissions.allowConfigEdit) return refuse('editing kubb.config.ts was not granted', AgentPermission.CONFIG_EDIT)
    const busy = this.#busy()
    if (busy) return refuse(busy)
    if (!kubbBin) return refuse('kubb is not installed in the project')

    const { failed, output } = await this.#runKubb({ bin: kubbBin, args: ['add', input.id, '--yes', '--config', configFile] })
    await this.#logCommand('installExtension', `${failed ? 'failed to install' : 'installed'} ${input.id}`, input.requestedBy, failed)
    return failed ? { installed: false, reason: output } : { installed: true }
  }

  /**
   * Moves installed extensions to the registry's version with `kubb update [ids] --yes`, which
   * installs packages and leaves `kubb.config.ts` alone. Studio calls `connect()` again afterwards.
   */
  async updateExtensions(input: UpdateExtensionsInput): Promise<UpdateExtensionsResult> {
    this.#assertConnected()
    const { root, kubbBin = findKubbBin(root) } = this.#options
    const refuse = async (reason: string, permission?: AgentPermission): Promise<UpdateExtensionsResult> => {
      await this.#warn({ message: `Ignored update: ${reason}`, permission })
      return { updated: false, reason }
    }

    const ids = input?.ids ?? []
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string' && REGISTRY_ID.test(id))) return refuse('the message carried an invalid registry id')
    if (!this.#permissions.allowUpdate) return refuse('updating extensions was not granted', AgentPermission.UPDATE)
    const busy = this.#busy()
    if (busy) return refuse(busy)
    if (!kubbBin) return refuse('kubb is not installed in the project')

    const { failed, output } = await this.#runKubb({ bin: kubbBin, args: ['update', ...ids, '--yes'] })
    await this.#logCommand('updateExtensions', `${failed ? 'failed to update' : 'updated'} ${ids.join(', ') || 'all extensions'}`, input?.requestedBy, failed)
    return failed ? { updated: false, reason: output } : { updated: true }
  }

  /**
   * Removes an extension with `kubb remove <id> --yes`, which deletes it from `kubb.config.ts` and
   * uninstalls its package. Studio calls `connect()` again afterwards.
   */
  async removeExtension(input: RemoveExtensionInput): Promise<RemoveExtensionResult> {
    this.#assertConnected()
    const { root, configFile, kubbBin = findKubbBin(root) } = this.#options
    const refuse = async (reason: string, permission?: AgentPermission): Promise<RemoveExtensionResult> => {
      await this.#warn({ message: `Ignored remove: ${reason}`, permission })
      return { removed: false, reason }
    }

    if (typeof input?.id !== 'string' || !REGISTRY_ID.test(input.id)) return refuse('the message carried no registry id')
    if (!this.#permissions.allowRemove) return refuse('removing extensions was not granted', AgentPermission.REMOVE)
    if (!this.#permissions.allowConfigEdit) return refuse('editing kubb.config.ts was not granted', AgentPermission.CONFIG_EDIT)
    const busy = this.#busy()
    if (busy) return refuse(busy)
    if (!kubbBin) return refuse('kubb is not installed in the project')

    const { failed, output } = await this.#runKubb({ bin: kubbBin, args: ['remove', input.id, '--yes', '--config', configFile] })
    await this.#logCommand('removeExtension', `${failed ? 'failed to remove' : 'removed'} ${input.id}`, input.requestedBy, failed)
    return failed ? { removed: false, reason: output } : { removed: true }
  }

  /** Why a command that touches the project cannot start right now. */
  #busy(): string | undefined {
    if (this.#session.active) return 'a generation is in progress'
    if (this.#session.install) return 'an install, update, or remove is in progress'
    if (this.#session.saving) return 'a save is in progress'
    return undefined
  }

  /** Runs `kubb` in the project while holding off saves and generations, and ends it when the socket closes. */
  async #runKubb({ bin, args }: { bin: string; args: Array<string> }) {
    const controller = new AbortController()
    const settled = Promise.withResolvers<void>()
    this.#session.install = { abort: () => controller.abort(), settled: settled.promise }
    try {
      return await runKubb({ bin, args, cwd: this.#options.root, signal: controller.signal })
    } finally {
      this.#session.install = undefined
      settled.resolve()
    }
  }

  /**
   * Returns the Kubb AST a kept job parsed its spec into. Refused without `allowReadAst`.
   */
  async readInput(input: ReadInputInput): Promise<ReadInputResult> {
    this.#assertConnected()
    if (!this.#permissions.allowReadAst) return this.#refuse({ message: AgentMessage.READ_AST_NOT_ALLOWED, permission: AgentPermission.READ_AST })
    if (typeof input.jobId !== 'string' || !input.jobId) return this.#refuse({ message: AgentMessage.JOB_REQUIRED })

    const generation = await this.#generations.get(input.jobId)
    if (!generation) return this.#refuse({ message: AgentMessage.GENERATION_GONE })
    // A rerun of the job can leave an earlier run's input on disk, so trust only what this run kept.
    const kept = generation.inputBytes ? await this.#generations.readInput(input.jobId) : undefined
    if (!kept) return this.#refuse({ message: AgentMessage.NO_INPUT })
    await this.#logCommand('readInput', 'read the API input')

    return { input: kept }
  }

  /**
   * Returns the requested files of a kept job, one page of lines at a time. Refused without `allowRead`.
   */
  async readFiles(input: ReadFilesInput): Promise<ReadFilesResult> {
    this.#assertConnected()
    if (!this.#permissions.allowRead) return this.#refuse({ message: AgentMessage.READ_NOT_ALLOWED, permission: AgentPermission.READ })
    if (!Array.isArray(input.paths) || typeof input.jobId !== 'string' || !input.jobId) {
      return this.#refuse({ message: AgentMessage.FILE_REQUEST_INVALID })
    }
    const { paths } = input
    if (paths.length > MAX_FILES_PER_REQUEST) return this.#refuse({ message: AgentMessage.TOO_MANY_FILES })
    if (!isValidPage(input)) return this.#refuse({ message: AgentMessage.INVALID_PAGE })

    const generation = await this.#generations.get(input.jobId)
    if (!generation) return this.#refuse({ message: AgentMessage.GENERATION_GONE })

    // Only paths the set holds are read, never an arbitrary path.
    const result = await this.#generations.read({ generation, paths, cursor: input.cursor, limit: input.limit })
    await this.#logCommand('readFiles', `read ${Object.keys(result.files).length}/${paths.length} requested file${paths.length === 1 ? '' : 's'}`)

    return result
  }

  /**
   * Returns one page of the line diff of a file between two kept sets. Refused without `allowRead`.
   */
  async readDiff(input: ReadDiffInput): Promise<ReadDiffResult> {
    this.#assertConnected()
    if (!this.#permissions.allowRead) return this.#refuse({ message: AgentMessage.READ_NOT_ALLOWED, permission: AgentPermission.READ })
    const { jobId, path, base, cursor = 0, limit } = input
    if (typeof jobId !== 'string' || !jobId || typeof path !== 'string' || !path || typeof base?.jobId !== 'string' || !base.jobId) {
      return this.#refuse({ message: AgentMessage.DIFF_REQUEST_INVALID })
    }
    if (!isValidPage({ cursor, limit })) {
      return this.#refuse({ message: AgentMessage.INVALID_PAGE })
    }

    const [generation, baseGeneration] = await Promise.all([this.#generations.get(jobId), this.#generations.get(base.jobId)])
    if (!generation || !baseGeneration) return this.#refuse({ message: AgentMessage.GENERATION_GONE })

    // Only paths the sets hold are read, never an arbitrary path.
    const [after, before] = await Promise.all([
      this.#generations.read({ generation, paths: [path] }),
      this.#generations.read({ generation: baseGeneration, paths: [path] }),
    ])
    const afterContent = after.files[path]
    // Over the size cap only hashes are kept, which must not read as a deleted file.
    if (afterContent === undefined && path in generation.output.hashes) return this.#refuse({ message: AgentMessage.HASHES_ONLY })
    const beforeContent = before.files[path]
    if (beforeContent === undefined)
      return { hunks: [], nextCursor: null, hasBase: false, stats: { additions: 0, deletions: 0, hunks: 0, lines: 0, coarse: false } }

    const key = JSON.stringify([jobId, base.jobId, path])
    let diff = this.#diffs.get(key)
    if (!diff) {
      diff = diffHunks(beforeContent, afterContent ?? '')
      this.#diffs.set(key, diff)
      // A few recent diffs cover paging through the open file and switching back to the last one.
      if (this.#diffs.size > 4) this.#diffs.delete(this.#diffs.keys().next().value!)
    }
    await this.#logCommand('readDiff', `read the diff of ${path}`)

    return { ...pageHunks({ hunks: diff.hunks, cursor, limit }), hasBase: true, stats: diff.stats }
  }
}

const openWebSocketRpc: OpenRpc = ({ url, token, instanceId, agent }) => {
  // Node's `WebSocket` takes undici's `headers` option, which the DOM typing leaves out.
  const NodeWebSocket = WebSocket as unknown as new (url: URL, init: { headers: Record<string, string> }) => WebSocket
  const socket = new NodeWebSocket(url, { headers: { Authorization: `Bearer ${token}`, [AGENT_INSTANCE_HEADER]: instanceId } })
  const timer = setTimeout(() => socket.close(3008, 'Connection timeout'), OPEN_TIMEOUT_MS)
  socket.addEventListener('open', () => clearTimeout(timer), { once: true })

  const closed = new Promise<Awaited<Rpc['closed']>>((resolve) => {
    socket.addEventListener('close', ({ code, reason }) => resolve({ code, reason }), { once: true })
    // Node fires only `error` when the handshake itself fails.
    socket.addEventListener('error', () => {
      if (socket.readyState !== WebSocket.OPEN) resolve({ code: 1006, reason: '' })
    })
  }).finally(() => clearTimeout(timer))

  const studio = newWebSocketRpcSession<StudioApi>(socket, agent)
  studio.onRpcBroken(() => socket.close())

  return {
    studio,
    closed,
    close: () => {
      studio[Symbol.dispose]()
      socket.close()
    },
  }
}

async function runSession({ options, openRpc, url, instanceId }: { options: ResolvedOptions; openRpc: OpenRpc; url: URL; instanceId: string }) {
  const { hooks, signal, heartbeatInterval, token, studioUrl, version } = options
  const session: Session = { connected: Promise.withResolvers(), closed: false }
  const agent = new Agent({ options, session })
  const rpc = openRpc({ url, token, instanceId, agent })
  signal?.addEventListener('abort', rpc.close, { once: true })
  let timer: ReturnType<typeof setTimeout> | undefined

  // Races each ping against a deadline, so a half-open socket can't hang it forever.
  const heartbeat = async (): Promise<void> => {
    let deadline: ReturnType<typeof setTimeout> | undefined
    const timedOut = new Promise<boolean>((resolve) => (deadline = setTimeout(resolve, PING_TIMEOUT_MS, true)))
    const failed = await Promise.race([
      Promise.resolve(rpc.studio.ping()).then(
        () => false,
        () => true,
      ),
      timedOut,
    ])
    clearTimeout(deadline)
    if (failed) return rpc.close()
    if (!session.closed) timer = setTimeout(heartbeat, heartbeatInterval)
  }

  void session.connected.promise.then(
    async (info) => {
      await emit(hooks, 'studio:connected', { ...info, url: studioUrl, versions: { studio: info.studioVersion, kubb: kubbVersion, agent: version } })
      if (!session.closed) timer = setTimeout(heartbeat, heartbeatInterval)
    },
    () => {},
  )

  const close = await rpc.closed
  session.closed = true
  clearTimeout(timer)
  signal?.removeEventListener('abort', rpc.close)
  session.connected.reject(new Error('The socket closed before Studio called connect()'))
  // Captured and aborted before the warning, so a slow listener neither keeps the run going nor
  // sees it finish and clear `session.active` first.
  const active = session.active
  if (active) {
    active.abort()
    await emit(hooks, 'studio:warn', { message: 'Canceled the running generation: the connection to Kubb Studio closed' })
  }
  await active?.settled
  session.install?.abort()
  await session.install?.settled
  await agent.clear()

  return { ...close, connected: session.info !== undefined }
}

/**
 * The connection loop with a swappable transport. {@link connectAgent} passes a real WebSocket.
 */
/** The entry Studio named by position or `name`, else the first. `undefined` for one the file does not have. */
function pickConfig(configs: Array<Config>, ref: ConfigRef | undefined): Config | undefined {
  if (typeof ref === 'string') return configs.find((config) => config.name === ref)
  if (ref !== undefined && !Number.isSafeInteger(ref)) return undefined
  return configs[ref ?? 0]
}

/** Whether `text` parses as JSON, so a pasted document is saved under the matching extension. */
function isJson(text: string): boolean {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

/** The input path or URL Studio may show: no inline document, and no credentials from a URL. */
function reportedInput(input: Config['input']): string | undefined {
  if (typeof input !== 'string') return undefined
  const kind = getInputKind(input)
  if (kind === 'inline') return undefined
  // The scp-style git form (`git+git@host:org/repo.git`) is no URL and carries no password.
  if ((kind !== 'url' && kind !== 'git') || !URL.canParse(input)) return input
  const url = new URL(input)
  url.username = ''
  url.password = ''
  return url.href
}

/** A JSON copy of one resolved entry, each extension named by the package its manifest is in. */
function toEntryView(config: Config, extensions: InstalledExtensions): ConfigEntryView {
  const input = reportedInput(config.input)
  return {
    ...(config.name !== undefined && { name: config.name }),
    ...(input !== undefined && { input }),
    output: config.output.path,
    outputOptions: toJSONOptions(pickOutput(config.output)),
    plugins: config.plugins.map((plugin) => ({
      name: toStudioName({ name: resolveMeta(plugin).name, extensions }),
      options: toJSONOptions(plugin.options),
    })),
    adapter: config.adapter && {
      name: toStudioName({ name: resolveMeta(config.adapter).name, extensions, kind: 'adapter' }),
      options: toJSONOptions(config.adapter.options),
    },
    parsers: config.parsers.map((parser) => ({
      name: toStudioName({ name: resolveMeta(parser).name, extensions, kind: 'parser' }),
      options: toJSONOptions(parser.options),
    })),
  }
}

export async function runAgent({ options, openRpc }: { options: ConnectAgentOptions; openRpc: OpenRpc }): Promise<void> {
  const root = options.root ?? process.cwd()
  const resolved: ResolvedOptions = {
    ...options,
    studioUrl: options.studioUrl ?? defaultStudioUrl,
    root,
    configFile: path.resolve(root, options.configPath),
    permissions: {
      allowWrite: false,
      allowConfigEdit: false,
      allowInstall: false,
      allowUpdate: false,
      allowRemove: false,
      allowSaveInput: false,
      allowExec: false,
      allowRead: false,
      allowReadAst: false,
      ...options.permissions,
    },
    hooks: options.hooks ?? new Hookable<KubbHooks>(),
    maxRetryDelay: options.maxRetryDelay ?? MAX_RETRY_DELAY_MS,
    heartbeatInterval: Math.min(options.heartbeatInterval ?? HEARTBEAT_INTERVAL_MS, MAX_HEARTBEAT_INTERVAL_MS),
  }
  const { studioUrl, hooks, signal, maxRetryDelay } = resolved
  const url = secureUrl({ studioUrl, path: AGENT_SOCKET_PATH, socket: true })
  // One per call, so a reconnect is the same process to Studio and a restart is a new one.
  const instanceId = randomUUID()
  let attempt = 0

  while (!signal?.aborted) {
    const { code, reason, connected } = await runSession({ options: resolved, openRpc, url, instanceId })
    if (signal?.aborted) return
    await emit(hooks, 'studio:disconnected', { code, reason })

    if (code === AgentCloseCode.UNAUTHORIZED) throw new InvalidAgentTokenError(studioUrl)
    if (code === AgentCloseCode.INCOMPATIBLE) throw new IncompatibleAgentError({ studioUrl, detail: reason })
    if (code === AgentCloseCode.SUPERSEDED) return

    // Reset only once Studio called connect(), so a socket that opens and closes again backs off.
    if (connected) attempt = 0
    const delayMs = Math.random() * Math.min(1_000 * 2 ** Math.min(attempt++, 16), maxRetryDelay)
    await emit(hooks, 'studio:reconnecting', { delayMs })
    await delay(delayMs, undefined, { signal }).catch(() => {})
  }
}

/**
 * Connects this project to Kubb Studio and serves its commands until `signal` aborts. Reconnects
 * with jittered backoff, and resolves when another process of the agent takes over. Rejects with
 * {@link InvalidAgentTokenError} so the host can pair again, or {@link IncompatibleAgentError}.
 *
 * @example
 * ```ts
 * const hooks = new Hookable<KubbHooks>()
 * hooks.hook('studio:connected', ({ agentSlug }) => console.log(`Connected as ${agentSlug}`))
 *
 * await connectAgent({ token, configPath: 'kubb.config.ts', loadConfigs, version: '1.0.0', hooks, signal })
 * ```
 */
export function connectAgent(options: ConnectAgentOptions): Promise<void> {
  return runAgent({ options, openRpc: openWebSocketRpc })
}
