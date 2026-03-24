/**
 * Models one variable definition in an OpenAPI server object.
 */
type ServerVariable = {
  default?: string | number
  enum?: (string | number)[]
}

/**
 * Minimal shape of an OpenAPI server object.
 */
type ServerObject = {
  url: string
  variables?: Record<string, ServerVariable>
}

/**
 * Resolves an OpenAPI server URL by substituting `{variable}` placeholders.
 *
 * Resolution priority per variable:
 * 1. `overrides[key]` — caller-supplied value.
 * 2. `variable.default` — spec-defined default, coerced to `string`.
 * 3. Variable is left unreplaced when neither is available.
 *
 * Throws when an `overrides` value is not present in the variable's `enum` list.
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
