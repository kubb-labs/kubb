import { existsSync } from 'node:fs'
import { relative } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { detectTool, FORMATTER_PREFERENCE, formatters, LINTER_PREFERENCE, linters, type ToolCommand, tokenize } from '@internals/utils'
import { Diagnostics } from '../Diagnostics.ts'
import type { Hookable } from '../Hookable.ts'
import type { Config, KubbHooks } from '../types.ts'
import type { Diagnostic, ProblemDiagnostic } from '../Diagnostics.ts'
import { runHook } from './runHook.ts'

export type RunOutputPassesOptions = {
  config: Config
  /**
   * Absolute directory the formatter and linter run over.
   */
  outputPath: string
  /**
   * Absolute paths of the files this run wrote, or left without a record of the passes having seen
   * them. The passes skip when it is empty, and a formatter that can take a file list runs over
   * these alone. Omitted to run every pass over the whole `outputPath`.
   */
  files?: ReadonlyArray<string>
  hooks: Hookable<KubbHooks>
  signal?: AbortSignal
}

type ToolPass = {
  kind: 'format' | 'lint'
  label: string
  verb: string
  tools: Record<string, ToolCommand>
  preference: ReadonlyArray<string>
  code: ProblemDiagnostic['code']
}

/**
 * Format and lint are one pass over the output directory that differs only in these values.
 * `label` and `verb` are spelled out: deriving them from `kind` gives "lintter" and "lintting".
 */
const TOOL_PASSES: ReadonlyArray<ToolPass> = [
  { kind: 'format', label: 'formatter', verb: 'Formatting', tools: formatters, preference: FORMATTER_PREFERENCE, code: Diagnostics.code.formatFailed },
  { kind: 'lint', label: 'linter', verb: 'Linting', tools: linters, preference: LINTER_PREFERENCE, code: Diagnostics.code.lintFailed },
]

type ToolPassRun = Pick<RunOutputPassesOptions, 'hooks' | 'outputPath' | 'files' | 'signal'> & { pass: ToolPass; setting: string; cwd: string }

/**
 * Characters of file paths per spawn. Windows runs `node_modules/.bin` shims through `cmd.exe`,
 * which stops at 8191 characters for the whole line.
 */
export const ARGS_LIMIT = process.platform === 'win32' ? 6_000 : 100_000

/**
 * Splits `paths` into runs whose summed length, one separator each, stays within `limit`. A path
 * longer than `limit` gets a run of its own.
 */
export function chunkPaths({ paths, limit }: { paths: ReadonlyArray<string>; limit: number }): Array<Array<string>> {
  const chunks: Array<Array<string>> = []
  let current: Array<string> = []
  let length = 0
  for (const path of paths) {
    if (current.length > 0 && length + path.length + 1 > limit) {
      chunks.push(current)
      current = []
      length = 0
    }
    current.push(path)
    length += path.length + 1
  }
  if (current.length > 0) chunks.push(current)
  return chunks
}

/**
 * The argv lists one pass spawns: one per chunk of `files` when the tool takes a file list, else one
 * over `outputPath`.
 */
function toolInvocations({
  tool,
  outputPath,
  files,
  cwd,
}: {
  tool: ToolCommand
  outputPath: string
  files?: ReadonlyArray<string>
  cwd: string
}): Array<Array<string>> {
  const fileArgs = tool.files
  if (!files || !fileArgs) return [tool.args(outputPath)]

  const paths = files.map((file) => relative(cwd, file))
  return chunkPaths({ paths, limit: ARGS_LIMIT }).map((chunk) => fileArgs(chunk))
}

/**
 * Resolves `auto` to an installed tool and runs it. Returns the failure instead of throwing.
 */
async function runToolPass({ pass, setting, outputPath, files, hooks, cwd, signal }: ToolPassRun): Promise<Error | null> {
  // Every generated file is as the last successful passes left it, so they would change nothing.
  if (files?.length === 0) return null

  const detected = setting === 'auto' ? await detectTool(pass.preference, cwd) : setting
  if (!detected) {
    await hooks.callHook('kubb:warn', { message: `No ${pass.label} found (${pass.preference.join(', ')}). Skipping ${pass.verb.toLowerCase()}.` })
    return null
  }
  if (setting === 'auto') {
    await hooks.callHook('kubb:info', { message: `Auto-detected ${pass.label}: ${styleText('dim', detected)}` })
  }

  const tool = pass.tools[detected]
  // Nothing to run over when the output directory was never written: the tool would fail on an
  // empty target (oxlint with --no-ignore reports "No files found to lint").
  if (!tool || !existsSync(outputPath)) return null

  const invocations = toolInvocations({ tool, outputPath, files, cwd })
  for (const args of invocations) {
    const result = await runHook({ hooks, command: tool.command, args, cwd, signal })
    if (!result.success) return result.error
  }
  const noun = files?.length === 1 ? 'file' : 'files'
  const target = files && tool.files ? `${files.length} ${noun}` : outputPath
  await hooks.callHook('kubb:success', { message: `${pass.verb} with ${styleText('dim', detected)} on ${styleText('dim', target)} successfully` })
  return null
}

/**
 * Runs `output.format`, `output.lint` and `output.postGenerate` over the generated output and
 * returns the diagnostics they produced. Each failure is emitted through `Diagnostics.emit` and
 * returned, so it reaches the summary, the reporters and the exit code; the passes keep going so
 * one failing tool does not hide the next. `Kubb.generate()` runs this after an error-free build
 * unless the host passes its own `processOutput`.
 *
 * @example
 * ```ts
 * const diagnostics = await runOutputPasses({ config, outputPath: '/repo/src/gen', hooks })
 * ```
 */
export async function runOutputPasses({ config, outputPath, files, hooks, signal }: RunOutputPassesOptions): Promise<Array<Diagnostic>> {
  const diagnostics: Array<Diagnostic> = []
  const report = async (code: ProblemDiagnostic['code'], label: string, error: Error) => {
    const diagnostic: ProblemDiagnostic = {
      code,
      severity: 'error',
      message: `${label} failed: ${error.message}`,
      help: 'Check that the tool is installed and that the command and its config are correct.',
      location: { kind: 'config' },
      cause: error,
    }
    diagnostics.push(diagnostic)
    await Diagnostics.emit(hooks, diagnostic)
  }

  for (const pass of TOOL_PASSES) {
    const setting = config.output[pass.kind]
    if (!setting) continue

    await hooks.callHook(`kubb:${pass.kind}:start`)
    const error = await runToolPass({ pass, setting, outputPath, files, hooks, cwd: config.root, signal })
    if (error) await report(pass.code, pass.label, error)
    await hooks.callHook(`kubb:${pass.kind}:end`)
    signal?.throwIfAborted()
  }

  const commands = config.output.postGenerate ?? []
  if (commands.length === 0) return diagnostics

  await hooks.callHook('kubb:hooks:start')
  for (const entry of commands) {
    const { command, name } = typeof entry === 'string' ? { command: entry, name: undefined } : entry
    const [executable, ...args] = tokenize(command)
    if (!executable) continue

    const result = await runHook({ hooks, command: executable, args, name, cwd: config.root, signal })
    if (result.success) await hooks.callHook('kubb:success', { message: `${styleText('dim', name ?? command)} successfully executed` })
    if (!result.success) await report(Diagnostics.code.postGenerateFailed, 'Post-generate command', result.error)
    signal?.throwIfAborted()
  }
  await hooks.callHook('kubb:hooks:end')

  return diagnostics
}
