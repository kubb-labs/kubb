type ServerVariable = {
  default?: string | number
  enum?: (string | number)[]
}

type ServerObject = {
  url: string
  variables?: Record<string, ServerVariable>
}

/**
 * Resolves an OpenAPI server URL by substituting `{variable}` placeholders
 * with values from `overrides` (user-provided) or the spec-defined defaults.
 *
 * Throws if an override value is not in the variable's `enum` list.
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
