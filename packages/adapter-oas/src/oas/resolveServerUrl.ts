/**
 * One variable definition inside an OpenAPI server object.
 */
type ServerVariable = {
  default?: string | number
  enum?: (string | number)[]
}

/**
 * Minimal shape of an OpenAPI server entry (`oas.api.servers[n]`).
 */
type ServerObject = {
  url: string
  variables?: Record<string, ServerVariable>
}

/**
 * Resolves `{variable}` placeholders in an OpenAPI server URL.
 *
 * Resolution order per variable: `overrides[key]` → `variable.default` → left unreplaced.
 * Throws when an override value is not in the variable's allowed `enum` list.
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
      throw new Error(`Invalid server variable value '${value}' for '${key}' when resolving ${server.url}. Valid values are: ${variable.enum.join(', ')}.`)
    }

    url = url.replaceAll(`{${key}}`, value)
  }

  return url
}
