import { existsSync } from 'node:fs'
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

type ToolPassRun = Pick<RunOutputPassesOptions, 'hooks' | 'outputPath' | 'signal'> & { pass: ToolPass; setting: string; cwd: string }

/**
 * Resolves `auto` to an installed tool and runs it. Returns the failure instead of throwing.
 */
async function runToolPass({ pass, setting, outputPath, hooks, cwd, signal }: ToolPassRun): Promise<Error | null> {
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

  const result = await runHook({ hooks, command: tool.command, args: tool.args(outputPath), cwd, signal })
  if (result.success) {
    await hooks.callHook('kubb:success', { message: `${pass.verb} with ${styleText('dim', detected)} on ${styleText('dim', outputPath)} successfully` })
    return null
  }
  return result.error
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
export async function runOutputPasses({ config, outputPath, hooks, signal }: RunOutputPassesOptions): Promise<Array<Diagnostic>> {
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
    const error = await runToolPass({ pass, setting, outputPath, hooks, cwd: config.root, signal })
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
