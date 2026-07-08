import { resolve } from 'node:path'
import { Diagnostics } from './Diagnostics.ts'
import type { AdapterSource, Config, Input } from './types.ts'

/**
 * What an `input` value points at, once Kubb has looked at it.
 *
 * - `file` is a local file path, absolute or relative to the config file.
 * - `url` is a remote document to fetch.
 * - `inline` is OpenAPI content held in the string itself (JSON or YAML).
 * - `object` is an already-parsed spec.
 */
export type InputKind = 'file' | 'url' | 'inline' | 'object'

/**
 * Classifies an `input` value so callers branch on it once instead of repeating the checks.
 *
 * A non-string is a parsed spec (`object`). A string is `inline` when it holds OpenAPI content,
 * meaning it starts with `{` or `[`, spans multiple lines, or opens with a YAML `openapi:` or
 * `swagger:` key. Otherwise a string is a `url` when it parses as one, or a `file` path.
 */
export function getInputKind(input: NonNullable<Input>): InputKind {
  if (typeof input !== 'string') return 'object'

  const trimmed = input.trimStart()
  const isInline = trimmed.startsWith('{') || trimmed.startsWith('[') || input.includes('\n') || /^(openapi|swagger)\s*:/i.test(trimmed)
  if (isInline) return 'inline'

  if (URL.canParse(input)) return 'url'

  return 'file'
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

  const kind = getInputKind(input)
  if (kind === 'inline') return { type: 'data', data: input }
  if (kind === 'url') return { type: 'path', path: input }

  return { type: 'path', path: resolve(config.root, input) }
}
