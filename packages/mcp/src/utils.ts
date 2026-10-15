import type { SerializedDiagnostic } from '@kubb/core'

/**
 * Renders serialized diagnostics as a plain-text block for an AI assistant. Each entry
 * keeps the stable `code`, the source pointer, the suggested fix, the cause, the underlying
 * errors, the docs link, and the issue tracker, so the agent can act on the problem rather
 * than parsing a bare message. No ANSI styling, unlike the CLI renderer.
 */
export function formatDiagnostics(diagnostics: ReadonlyArray<SerializedDiagnostic>): string {
  return diagnostics.map((diagnostic) => formatDiagnostic(diagnostic)).join('\n\n')
}

function formatDiagnostic(diagnostic: SerializedDiagnostic): string {
  const { code, message, location, help, cause, causes, plugin, docsUrl, issues } = diagnostic
  const lines = [plugin ? `[${code}] ${plugin}: ${message}` : `[${code}]: ${message}`]

  if (location && 'pointer' in location) {
    lines.push(`  at: ${location.pointer}`)
  }
  if (help) {
    lines.push(`  fix: ${help}`)
  }
  if (cause) {
    lines.push(`  why: ${cause}`)
  }
  for (const causeMessage of causes ?? []) {
    lines.push(`  caused by: ${causeMessage}`)
  }
  if (docsUrl) {
    lines.push(`  see: ${docsUrl}`)
  }
  if (issues) {
    lines.push(`  report: ${issues}`)
  }

  return lines.join('\n')
}
