import { hash } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { type Config, createKubb, type Diagnostic, Diagnostics, type Hookable } from '@kubb/core'
import {
  FORMATTER_PREFERENCE,
  LINTER_PREFERENCE,
  formatters,
  linters,
  memoize,
  tokenize,
  type ToolCommand,
  detectTool as detectUncachedTool,
} from '@internals/utils'
import { type AgentHooks, waitForHookEnd } from './hooks.ts'

/**
 * `isToolAvailable` spawns a process, and a long-lived connection generates repeatedly, so each
 * executable is probed once per process. The CLI deliberately does not memoize: a `--watch` build
 * should keep noticing a tool installed mid-session.
 */
const detectTool = memoize(new Map<ReadonlyArray<string>, Promise<string | null>>(), detectUncachedTool)

/**
 * The two post-build tool steps. Formatting and linting differ only in which tools they look for,
 * so they run through one loop rather than two near-identical blocks.
 */
const STEPS: ReadonlyArray<{ kind: 'format' | 'lint'; tools: Record<string, ToolCommand>; detect: ReadonlyArray<string> }> = [
  // `detect` is the preference order for `auto`, most-preferred first. Spelled out rather than
  // taken from the table's key order, which is arbitrary and silently changes what `auto` picks.
  { kind: 'format', tools: formatters, detect: FORMATTER_PREFERENCE },
  { kind: 'lint', tools: linters, detect: LINTER_PREFERENCE },
]

/**
 * Absolute path of the directory the formatter and linter are pointed at.
 */
function outputPath(config: Config): string {
  return path.isAbsolute(config.output.path) ? config.output.path : path.resolve(process.cwd(), config.root, config.output.path)
}

type RunHookProps = {
  hooks: Hookable<AgentHooks>
  /**
   * Stable identity for the command, hashed so the `kubb:hook:*` events for concurrent commands
   * can be told apart.
   */
  id: string
  command: string
  args: ReadonlyArray<string>
}

/**
 * Emits `kubb:hook:start` and waits for the matching `kubb:hook:end`. The host spawns the process:
 * this only describes what to run and when it finished.
 *
 * @throws whatever the command failed with, so callers can report it their own way.
 */
async function runHook({ hooks, id, command, args }: RunHookProps): Promise<void> {
  const hookId = hash('sha256', id)
  // Registered before the start event, since `callHook` awaits its listeners and the host calls
  // `kubb:hook:end` from inside that same listener.
  const hookEnd = waitForHookEnd(hooks, hookId)

  await hooks.callHook('kubb:hook:start', { id: hookId, command, args: [...args] })
  await hookEnd
}

type GenerateProps = {
  config: Config
  hooks: Hookable<AgentHooks>
}

function isProblemErrorDiagnostic(diagnostic: Diagnostic): diagnostic is Diagnostic & { plugin?: string; message: string } {
  return (diagnostic.kind ?? 'problem') === 'problem' && diagnostic.severity === 'error'
}

/**
 * Folds error-severity diagnostics into one thrown error so logs name the failing plugin.
 */
function formatGenerationFailure(diagnostics: ReadonlyArray<Diagnostic>): Error {
  const reasons = diagnostics
    .filter(isProblemErrorDiagnostic)
    .map((diagnostic) => (diagnostic.plugin ? `${diagnostic.plugin}: ${diagnostic.message}` : diagnostic.message))

  if (!reasons.length) {
    return new Error('Generation failed')
  }

  return new Error(`Generation failed: ${reasons.length} error${reasons.length === 1 ? '' : 's'}: ${reasons.join('; ')}`)
}

/**
 * Run a full Kubb code-generation cycle for the given config.
 *
 * Emits lifecycle events on the provided `hooks` emitter so callers (e.g. the WebSocket stream)
 * can forward progress to connected clients.
 * After a successful build, auto-formatting and linting are applied when configured,
 * followed by any user-defined `hooks.done` commands.
 *
 */
export async function generate({ config, hooks }: GenerateProps): Promise<void> {
  const hrStart = process.hrtime()

  await hooks.callHook('kubb:generation:start', { config })

  await hooks.callHook('kubb:info', { message: config.name ? `Setup generation ${config.name}` : 'Setup generation' })

  const kubb = createKubb(config, { hooks })
  await kubb.setup()

  await hooks.callHook('kubb:info', { message: config.name ? `Build generation ${config.name}` : 'Build generation' })

  const { files, diagnostics, storage } = await kubb.safeBuild()

  await hooks.callHook('kubb:info', { message: 'Load summary' })

  // Core captures build failures as `error`-severity diagnostics instead of throwing, so
  // surface each one as a `kubb:error` event for the client. Warnings and info reported
  // through `ctx.warn`/`ctx.info` reach the client directly via core's events on this shared emitter.
  for (const diagnostic of diagnostics.filter(isProblemErrorDiagnostic)) {
    await hooks.callHook('kubb:error', { error: new Error(diagnostic.plugin ? `${diagnostic.plugin}: ${diagnostic.message}` : diagnostic.message) })
  }

  const status = Diagnostics.hasError(diagnostics) ? 'failed' : 'success'

  await hooks.callHook('kubb:generation:end', {
    config,
    // Only the files Kubb generated. `fsStorage().readKeys()` lists the working directory, so
    // Studio's tree would show the host's own source and miss output landing outside it.
    storage: { ...storage, readKeys: async () => [...new Set(files.map((file) => file.path))] },
    diagnostics,
    status,
    hrStart,
    filesCreated: files.length,
  })

  if (status === 'failed') {
    throw formatGenerationFailure(diagnostics)
  }

  await hooks.callHook('kubb:success', { message: 'Generation successfully' })

  for (const step of STEPS) {
    const setting = config.output[step.kind]
    if (!setting) {
      continue
    }

    await hooks.callHook(`kubb:${step.kind}:start`)

    // `auto` means "whatever is installed", so the tool is detected now rather than at config time.
    const tool = setting === 'auto' ? await detectTool(step.detect) : setting

    if (!tool) {
      await hooks.callHook('kubb:warn', { message: `No ${step.kind}ter found (${step.detect.join(', ')}). Skipping ${step.kind}ting.` })
    }

    if (tool && setting === 'auto') {
      await hooks.callHook('kubb:info', { message: `Auto-detected ${step.kind}ter: ${styleText('dim', tool)}` })
    }

    const command = tool ? step.tools[tool] : undefined

    if (command) {
      try {
        await runHook({ hooks, id: [config.name, tool].filter(Boolean).join('-'), command: command.command, args: command.args(outputPath(config)) })

        if (step.kind === 'format') {
          await hooks.callHook('kubb:success', { message: `Formatting with ${tool} successfully` })
        }
      } catch (caughtError) {
        await hooks.callHook('kubb:error', { error: new Error(command.errorMessage, { cause: caughtError }) })
      }
    }

    await hooks.callHook(`kubb:${step.kind}:end`)
  }

  // `output.postGenerate` commands run in order, each one waiting for the previous to finish.
  if (config.output.postGenerate?.length) {
    await hooks.callHook('kubb:hooks:start')

    for (const entry of config.output.postGenerate) {
      const line = typeof entry === 'string' ? entry : entry.command
      const [cmd, ...args] = tokenize(line)

      if (!cmd) {
        continue
      }

      await runHook({ hooks, id: line, command: cmd, args })
      await hooks.callHook('kubb:success', { message: `${line} successfully executed` })
    }

    await hooks.callHook('kubb:hooks:end')
  }
}
