import { Diagnostics } from '@kubb/core'
import type { Document, ServerObject, ServerOptions } from '../types.ts'

/**
 * Reads the server URL from the document's `servers` array at `server.index`,
 * interpolating any `server.variables` into the URL template.
 *
 * Returns `null` when `server.index` is omitted or out of range.
 *
 * @example Resolve the first server
 * `resolveBaseUrl({ document, server: { index: 0 } })`
 *
 * @example Override a path variable
 * `resolveBaseUrl({ document, server: { index: 0, variables: { version: 'v2' } } })`
 */
export function resolveBaseUrl({ document, server }: { document: Document; server?: ServerOptions }): string | null {
  const index = server?.index
  const entry = index !== undefined ? document.servers?.at(index) : undefined

  return entry?.url ? resolveServerUrl(entry, server?.variables) : null
}

/**
 * Replaces `{variable}` placeholders in an OpenAPI server URL with provided values.
 * Resolution order: `overrides[key]` → `variable.default` → left unreplaced.
 * Throws if an override value is not in the variable's `enum` list.
 *
 * @example
 * ```ts
 * resolveServerUrl(
 *   { url: 'https://{env}.api.example.com', variables: { env: { default: 'dev', enum: ['dev', 'prod'] } } },
 *   { env: 'prod' },
 * )
 * // 'https://prod.api.example.com'
 * ```
 */
export function resolveServerUrl(server: ServerObject, overrides?: Record<string, string>): string {
  if (!server.variables) {
    return server.url
  }

  let url = server.url
  for (const [key, variable] of Object.entries(server.variables)) {
    const value = overrides?.[key] ?? (variable.default != null ? String(variable.default) : undefined)
    if (value === undefined) {
      continue
    }

    if (variable.enum?.length && !variable.enum.some((e) => String(e) === value)) {
      throw new Diagnostics.Error({
        code: Diagnostics.code.invalidServerVariable,
        severity: 'error',
        message: `Invalid server variable value '${value}' for '${key}' when resolving ${server.url}. Valid values are: ${variable.enum.join(', ')}.`,
        help: `Use one of the allowed enum values, or drop the enum on the '${key}' server variable.`,
        location: { kind: 'document', pointer: '#/servers' },
      })
    }

    url = url.replaceAll(`{${key}}`, value)
  }

  return url
}
