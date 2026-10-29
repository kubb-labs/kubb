/**
 * Sanitizes a parameter name so it is safe to use as a `path-to-regexp` capture name, without
 * routing through {@link camelCase} (which keeps a leading `$` since it is a valid JS identifier
 * character). Runs of disallowed characters are treated as word boundaries; a boundary at the
 * very start of the name (e.g. the `$` in `$id`) still capitalizes the word that follows it.
 */
function transformPathParam(raw: string): string {
  // `path-to-regexp` (used by MSW/Express) only accepts `[A-Za-z0-9_]` in a parameter name. It stops
  // reading at the first other character (a hyphen, a dot, a `$`, ...), which misparses the route or
  // throws "Missing parameter name".
  if (/^[A-Za-z0-9_]+$/.test(raw)) {
    return raw
  }

  const startsWithSafeChar = /^[A-Za-z_]/.test(raw)
  const words = raw.split(/[^A-Za-z0-9]+/).filter(Boolean)

  return words
    .map((word, i) => {
      const capitalize = !startsWithSafeChar || i > 0
      return capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word.charAt(0).toLowerCase() + word.slice(1)
    })
    .join('')
}

/**
 * Renders how a grouped `path` object's member is accessed: dot access for an identifier (reserved
 * words are valid property names), bracket access with the raw name otherwise.
 */
function groupedAccessor(name: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) ? `.${name}` : `[${JSON.stringify(name)}]`
}

/**
 * Static helpers for OpenAPI/Swagger paths: template syntax conversion, parameter extraction, and URL composition.
 */
export class Url {
  /**
   * Converts an OpenAPI/Swagger path to Express-style colon syntax.
   *
   * Distinct parameter names that normalize to the same identifier (e.g. `{group-id}` and
   * `{group.id}` both becoming `groupId`) are deduplicated with an incrementing suffix so
   * `path-to-regexp` never sees two identically named captures.
   *
   * @example
   * Url.toPath('/pet/{petId}') // '/pet/:petId'
   *
   * @example
   * Url.toPath('/point/{point-id}') // '/point/:pointId'
   *
   * @example
   * Url.toPath('/groups/{group-id}/{group.id}.json') // '/groups/:groupId/:groupId2.json'
   */
  static toPath(path: string): string {
    const seen = new Map<string, number>()

    return path.replace(/\{([^}]+)\}/g, (_match, param: string) => {
      const base = transformPathParam(param)
      const count = (seen.get(base) ?? 0) + 1
      seen.set(base, count)

      return count === 1 ? `:${base}` : `:${base}${count}`
    })
  }

  /**
   * Converts an OpenAPI/Swagger path to a template literal that reads each parameter off a
   * grouped `path` request option, e.g. `/pet/{petId}` becomes `` `/pet/${path.petId}` ``.
   * Parameter names are kept exactly as they appear in the OpenAPI path; a name falls back to
   * bracket access (`` path['pet-id'] ``) only when it isn't a valid JS identifier.
   * `prefix` is prepended inside the literal. Shared by generators that pass a grouped `path` object.
   *
   * @example
   * Url.toGroupedTemplateString('/pet/{petId}') // '`/pet/${path.petId}`'
   *
   * @example
   * Url.toGroupedTemplateString('/user/{monetary-account-id}') // '`/user/${path["monetary-account-id"]}`'
   */
  static toGroupedTemplateString(path: string, { prefix }: { prefix?: string | null } = {}): string {
    const parts = path.split(/\{([^}]+)\}/)
    const result = parts.map((part, i) => (i % 2 === 0 ? part : `\${path${groupedAccessor(part)}}`)).join('')

    return `\`${prefix ?? ''}${result}\``
  }
}
