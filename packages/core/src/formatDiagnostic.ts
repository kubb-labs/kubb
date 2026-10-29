import { stripVTControlCharacters, styleText } from 'node:util'
import { getErrorChain } from '@internals/utils'
import { type DiagnosticCode, diagnosticCode, docsUrl, explain, isProblem } from './diagnosticCatalog.ts'
import type { Diagnostic, DiagnosticLocation, DiagnosticSeverity, ProblemDiagnostic } from './Diagnostics.ts'

/**
 * The problem fields `serialize` and `format` share: the `help` or the catalog fix (`info` gets
 * none, its catalog fix says no action is needed), the `cause` chain's messages outermost first
 * minus those `message` already contains, whether the code is a crash, and the root cause's stack
 * for a crash or when `verbose`.
 */
function inspect(
  diagnostic: Diagnostic,
  verbose = false,
): { problem?: ProblemDiagnostic; help?: string; causes: Array<string>; crash: boolean; stack?: string } {
  const problem = isProblem(diagnostic) ? diagnostic : undefined
  if (!problem) return { causes: [], crash: false }

  const crash = crashCodes.has(problem.code)
  const chain = getErrorChain(problem.cause)
  return {
    problem,
    help: problem.help || problem.severity === 'info' ? problem.help : explain(problem.code).fix,
    causes: chain
      .filter((error) => !problem.message.includes(error.message))
      .map((error) => (error.name === 'Error' ? error.message : `${error.name}: ${error.message}`)),
    crash,
    stack: verbose || crash ? chain.at(-1)?.stack : undefined,
  }
}

/**
 * Accent color per severity, which paints the icon in the `human` layout (red error, yellow
 * warning, blue info). The code itself stays dim.
 */
const severityStyle: Record<DiagnosticSeverity, 'red' | 'yellow' | 'blue'> = {
  error: 'red',
  warning: 'yellow',
  info: 'blue',
}

const severityIcon: Record<DiagnosticSeverity, string> = {
  error: '✖',
  warning: '⚠',
  info: 'ℹ',
}

/**
 * How {@link format} renders a diagnostic.
 */
export type DiagnosticFormatOptions = {
  /**
   * Who reads the output.
   * - `'agent'` spells out every detail on labeled rows
   * - `'human'` keeps it short and links to the docs
   * @default 'agent'
   */
  audience?: 'agent' | 'human'
  /**
   * Show the root cause's full stack.
   */
  verbose?: boolean
  /**
   * Columns the `human` headline fills, so the code lines up at the right edge.
   * @default 0
   */
  width?: number
  /**
   * Where the diagnostic's pointer sits in the input file, when the host resolved it. Replaces the
   * pointer on the `at` row, and an error's `human` layout draws `frame` under it.
   */
  position?: { file: string; line: number; column: number; frame?: Array<string> }
}

/**
 * Codes for a crash, which carry the root cause's stack.
 */
export const crashCodes: ReadonlySet<DiagnosticCode> = new Set([
  diagnosticCode.unknown,
  diagnosticCode.internalError,
  diagnosticCode.pluginFailed,
  diagnosticCode.adapterFailed,
  diagnosticCode.parserFailed,
])

/**
 * A {@link Diagnostic} reduced to its JSON-safe fields plus a `docsUrl`, for
 * machine-readable output (the `--reporter json` report, the MCP tools). Replaces the
 * non-serializable `cause` with its message chain and drops the `kind`/`duration` bookkeeping.
 */
export type SerializedDiagnostic = {
  code: DiagnosticCode
  severity: DiagnosticSeverity
  message: string
  /**
   * Catalog title.
   */
  title?: string
  /**
   * Catalog cause.
   */
  cause?: string
  location?: DiagnosticLocation
  /**
   * The diagnostic's `help`, or the catalog fix.
   */
  help?: string
  plugin?: string
  issues?: string
  /**
   * Messages of the underlying errors, outermost first.
   */
  causes?: Array<string>
  /**
   * Root cause's stack, for `KUBB_UNKNOWN`, `KUBB_INTERNAL_ERROR`, and `*_FAILED` codes.
   */
  stack?: string
  /**
   * The kubb.dev docs link for the code, omitted for the unknown fallback.
   */
  docsUrl?: string
}

/**
 * Reduces a diagnostic to its JSON-safe fields plus a `docsUrl`, for machine-readable
 * consumers, with the catalog `title`, `cause`, and fix, and the `cause` error as `causes` and
 * `stack`. Absent optional fields are omitted.
 */
export function serialize(diagnostic: Diagnostic): SerializedDiagnostic {
  const { problem, help, causes, stack } = inspect(diagnostic)
  const doc = problem ? explain(problem.code) : undefined
  return {
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: diagnostic.message,
    ...(doc ? { title: doc.title, cause: doc.cause } : {}),
    ...(problem?.location ? { location: problem.location } : {}),
    ...(help ? { help } : {}),
    ...(problem?.plugin ? { plugin: problem.plugin } : {}),
    ...(problem?.issues ? { issues: problem.issues } : {}),
    ...(causes.length ? { causes } : {}),
    ...(stack ? { stack } : {}),
    ...(diagnostic.code === diagnosticCode.unknown ? {} : { docsUrl: docsUrl(diagnostic.code) }),
  }
}

/**
 * Renders a {@link Diagnostic} as lines: a headline, then indented detail rows. `agent` (the default)
 * prints uncolored labeled rows (`at:`, `why:`, `fix:`, `caused by:`, `stack:` for a crash,
 * `docs:`, `report:`). `human` prints an icon, the bold message, and the code aligned to `width`,
 * with `at`, `fix`, the first cause, and `Learn more` for an error, and one row for a warning.
 * `verbose` adds the full stack.
 */
export function format(diagnostic: Diagnostic, { audience = 'agent', verbose = false, width = 0, position }: DiagnosticFormatOptions = {}): Array<string> {
  const { code, severity, message } = diagnostic
  const { problem, help, causes, stack: rootStack } = inspect(diagnostic, verbose)
  const human = audience === 'human'
  const paint: typeof styleText = human ? styleText : (_format, text) => text

  const [firstLine = '', ...rest] = message.split('\n')
  const pointer = problem?.location && 'pointer' in problem.location ? problem.location.pointer : undefined
  const at = position ? `${position.file}:${position.line}:${position.column}` : undefined
  const where = at ?? pointer
  // A crash's stack is for the agent layout; a human sees it only with `verbose`.
  const stack = verbose || !human ? rootStack : undefined
  const frames = stack
    ?.split('\n')
    .slice(1, verbose ? undefined : 4)
    .map((frame) => `    ${paint('dim', frame.trim())}`)

  if (!human) {
    const details = rest.filter((line) => line.trim()).map((line) => `  ${line}`)
    const row = (label: string, value: string | undefined) => {
      if (value) details.push(`  ${label}: ${value}`)
    }
    row('at', at && pointer ? `${at} (${pointer})` : pointer)
    if (problem && severity !== 'info') row('why', explain(problem.code).cause)
    row('fix', help)
    for (const cause of causes) row('caused by', cause)
    if (frames?.length) details.push('  stack:', ...frames)
    if (code !== diagnosticCode.unknown) row('docs', docsUrl(code))
    row('report', problem?.issues)

    return [`${severity} ${code}${problem?.plugin ? ` [${problem.plugin}]` : ''}: ${firstLine}`, ...details]
  }

  const left = `${paint(severityStyle[severity], severityIcon[severity])} ${paint('bold', firstLine)}`
  const gap = width - stripVTControlCharacters(left).length - code.length
  // A headline too long to share its row with the code would wrap mid-code, so the code drops to its own right-aligned row.
  const headline =
    width && gap < 2
      ? [left, `${' '.repeat(Math.max(0, width - code.length))}${paint('dim', code)}`]
      : [`${left}${' '.repeat(Math.max(2, gap))}${paint('dim', code)}`]

  const frame = rest.filter((line) => line.trim()).map((line) => `  ${paint('dim', line)}`)
  const label = (name: string) => paint('dim', name.length < 4 ? name.padEnd(4) : `${name} `)
  const rows: Array<[label: string, value: string | undefined]> = [
    ['at', where && paint('cyan', where)],
    ['fix', help],
  ]
  if (severity !== 'error') {
    const first = rows.find(([, value]) => value)
    return [...headline, ...frame, ...(first ? [`  ${label(first[0])} ${first[1]}`] : [])]
  }
  rows.push(['caused by', causes[0]], ['report', problem?.issues && paint('cyan', problem.issues)])

  const codeFrame = (position?.frame ?? []).map((line) => `    ${line}`)
  const details = [...frame, ...rows.flatMap(([name, value]) => (value ? [`  ${label(name)} ${value}`, ...(name === 'at' ? codeFrame : [])] : []))]
  if (frames?.length) details.push(`  ${paint('dim', 'stack')}`, ...frames)
  if (code !== diagnosticCode.unknown) {
    details.push(`  ${paint('dim', '↳ Learn more')}  ${paint('cyan', docsUrl(code).replace(/^https:\/\//, ''))}`)
  }

  return [...headline, ...details]
}
