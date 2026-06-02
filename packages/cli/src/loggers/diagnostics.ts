import { styleText } from 'node:util'
import { type Diagnostic, diagnosticCode, diagnosticDocsUrl, type DiagnosticSeverity } from '@kubb/core'

export { diagnosticDocsUrl }

/**
 * Glyph and accent color per severity, matching the miette/oxlint convention
 * (`×` error, `⚠` warning, `ℹ` advice).
 */
const severityStyle: Record<DiagnosticSeverity, { glyph: string; color: 'red' | 'yellow' | 'blue' }> = {
  error: { glyph: '×', color: 'red' },
  warning: { glyph: '⚠', color: 'yellow' },
  info: { glyph: 'ℹ', color: 'blue' },
}

/**
 * The colored, bold severity glyph (`×`, `⚠`, `ℹ`) on its own. Pass it as clack's
 * `symbol` so clack owns the gutter and adds the bar to the continuation lines,
 * instead of baking the glyph into the message text.
 */
export function diagnosticSymbol(severity: DiagnosticSeverity): string {
  const { glyph, color } = severityStyle[severity]
  return styleText(color, styleText('bold', glyph))
}

/**
 * The `plugin(CODE): message` headline, without the leading severity glyph.
 */
export function diagnosticHeadline(diagnostic: Diagnostic): string {
  const { code, severity, message, plugin } = diagnostic
  const { color } = severityStyle[severity]

  const rule = styleText(color, styleText('bold', plugin ? `${plugin}(${code})` : code))
  return `${rule}: ${message}`
}

/**
 * The detail lines below the headline: optional `at <pointer>`, `help:`, and
 * `docs:`. OpenAPI has no line/column, so the location is the JSON pointer the
 * adapter built. Each line keeps a two-space indent so it sits under the headline.
 */
export function diagnosticDetails(diagnostic: Diagnostic): Array<string> {
  const { code, location, help } = diagnostic
  const lines: Array<string> = []

  if (location && 'pointer' in location) {
    lines.push(`  ${styleText('dim', 'at')} ${styleText('cyan', location.pointer)}`)
  }

  if (help) {
    lines.push(`  ${styleText('cyan', 'help:')} ${help}`)
  }

  if (code !== diagnosticCode.unknown) {
    lines.push(`  ${styleText('dim', 'docs:')} ${styleText('cyan', diagnosticDocsUrl(code))}`)
  }

  return lines
}

/**
 * Renders a {@link Diagnostic} in the oxlint style as a self-contained block: a
 * `× plugin(CODE): message` header followed by the {@link diagnosticDetails}.
 * Use this where clack's gutter is not available (plain, file output); clack
 * loggers pass {@link diagnosticSymbol}, {@link diagnosticHeadline}, and
 * {@link diagnosticDetails} to `clack.log.message` instead.
 *
 * @example
 * ```ts
 * formatDiagnostic({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'Could not find Pet', help: 'Add Pet under components.schemas.', plugin: '@kubb/plugin-zod', location: { kind: 'schema', pointer: '#/components/schemas/Pet' } })
 * ```
 */
export function formatDiagnostic(diagnostic: Diagnostic): Array<string> {
  return [`${diagnosticSymbol(diagnostic.severity)} ${diagnosticHeadline(diagnostic)}`, ...diagnosticDetails(diagnostic)]
}
