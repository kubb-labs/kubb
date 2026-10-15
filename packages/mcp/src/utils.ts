import { stripVTControlCharacters } from 'node:util'
import { type Diagnostic, Diagnostics } from '@kubb/core'

/**
 * Renders diagnostics as a plain-text block for an AI assistant, through the same
 * `Diagnostics.format` the CLI uses for agents, without ANSI styling. Each entry keeps the stable
 * code, the source pointer, the cause, the fix, the underlying errors, the docs link, and the issue
 * tracker, so the agent can act on the problem rather than parsing a bare message.
 */
export function formatDiagnostics(diagnostics: ReadonlyArray<Diagnostic>): string {
  return diagnostics.map((diagnostic) => stripVTControlCharacters(Diagnostics.formatLines(diagnostic, { audience: 'agent' }).join('\n'))).join('\n\n')
}
