import type { SerializedDiagnostic } from '@kubb/core'

/**
 * Renders serialized diagnostics as a plain-text block for an AI assistant. Each entry
 * keeps the stable `code`, the source pointer, the suggested fix, and the docs link, so
 * the agent can act on the problem rather than parsing a bare message. No ANSI styling,
 * unlike the CLI renderer.
 */
export function formatDiagnostics(diagnostics: ReadonlyArray<SerializedDiagnostic>): string {
  return diagnostics.map((diagnostic) => formatDiagnostic(diagnostic)).join('\n\n')
}

function formatDiagnostic(diagnostic: SerializedDiagnostic): string {
  const { code, severity, message, location, help, plugin, docsUrl } = diagnostic
  const rule = plugin ? `${plugin}(${code})` : code
  const lines = [`${severity} ${rule}: ${message}`]

  if (location && 'pointer' in location) {
    lines.push(`  at ${location.pointer}`)
  }
  if (help) {
    lines.push(`  help: ${help}`)
  }
  if (docsUrl) {
    lines.push(`  docs: ${docsUrl}`)
  }

  return lines.join('\n')
}
