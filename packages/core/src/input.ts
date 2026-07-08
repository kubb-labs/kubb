import { resolve } from 'node:path'
import { Diagnostics } from './Diagnostics.ts'
import type { AdapterSource, Config } from './types.ts'

/**
 * Detects whether a string is inline OpenAPI content rather than a file path or URL.
 *
 * Inline content is JSON (starts with `{` or `[`), spans multiple lines, or opens with a YAML
 * `openapi:`/`swagger:` key. A path or URL is a single line that never starts with a brace, so
 * running this check before the path/URL branch is safe.
 */
export function isInlineDocument(value: string): boolean {
  const trimmed = value.trimStart()

  return trimmed.startsWith('{') || trimmed.startsWith('[') || value.includes('\n') || /^(openapi|swagger)\s*:/i.test(trimmed)
}

/**
 * Normalizes `config.input` into an `AdapterSource` the adapter can parse.
 *
 * A parsed object and inline content become `{ type: 'data' }`; a URL is kept verbatim and a
 * local path is resolved against `config.root`, both as `{ type: 'path' }`.
 */
export function inputToAdapterSource(config: Config): AdapterSource {
  const input = config.input

  if (!input) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.inputRequired,
      severity: 'error',
      message: 'An adapter is configured without an input.',
      help: 'Set `input` to a file path, a URL, an inline spec (JSON/YAML string), or a parsed object in your Kubb config.',
      location: { kind: 'config' },
    })
  }

  if (typeof input !== 'string') {
    return { type: 'data', data: input }
  }

  if (isInlineDocument(input)) {
    return { type: 'data', data: input }
  }

  if (URL.canParse(input)) {
    return { type: 'path', path: input }
  }

  return { type: 'path', path: resolve(config.root, input) }
}
