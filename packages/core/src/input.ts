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
 * The v4 `input` wrapper keys. v4 typed `input` as `{ path }` or `{ data }`; v5 takes the value
 * directly, so the wrapper now matches the "already-parsed document" branch and silently yields
 * an empty build.
 */
const legacyInputKeys = ['path', 'data']

/**
 * Detects the v4 `{ path }` / `{ data }` wrapper so it fails loudly instead of being read as a
 * document. A real spec always carries more than these keys, so an object whose keys are drawn
 * only from them is the old shape rather than a document that happens to have a `path` property.
 */
function isLegacyInput(input: unknown): boolean {
  if (Array.isArray(input)) {
    return input.some(isLegacyInput)
  }

  if (typeof input !== 'object' || input === null) return false

  const keys = Object.keys(input)

  return keys.length > 0 && keys.every((key) => legacyInputKeys.includes(key))
}

/**
 * Normalizes `config.input` into an `AdapterSource` the adapter can parse.
 *
 * A parsed object and inline content become `{ type: 'data' }`; a URL is kept verbatim and a
 * local path is resolved against `config.root`, both as `{ type: 'path' }`.
 */
export function inputToAdapterSource(config: Config): AdapterSource {
  const input = config.input

  if (input && isLegacyInput(input)) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.legacyInput,
      severity: 'error',
      message: 'The `input` option uses the v4 `{ path }` / `{ data }` wrapper.',
      help: 'Unwrap it: `input: { path: "./petStore.yaml" }` becomes `input: "./petStore.yaml"`, and `input: { data: spec }` becomes `input: spec`.',
      location: { kind: 'config' },
    })
  }

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
