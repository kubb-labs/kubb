import { camelCase } from './casing.ts'
import { isValidVarName } from './reserved.ts'

type URLObject = {
  /**
   * The resolved URL string (Express-style or template literal, depending on context).
   */
  url: string
  /**
   * Extracted path parameters as a key-value map, or `null` when the path has none.
   */
  params: Record<string, string> | null
}

type TemplateOptions = {
  /**
   * Literal text prepended inside the template literal, e.g. a base URL.
   */
  prefix?: string | null
  /**
   * Transform applied to each extracted parameter name before interpolation.
   */
  replacer?: (pathParam: string) => string
}

type ObjectOptions = {
  /**
   * Controls whether the `url` is rendered as an Express path or a template literal.
   * @default 'path'
   */
  type?: 'path' | 'template'
  /**
   * Transform applied to each extracted parameter name.
   */
  replacer?: (pathParam: string) => string
  /**
   * When `true`, the result is serialized to a string expression instead of a plain object.
   */
  stringify?: boolean
}

function transformParam(raw: string): string {
  return isValidVarName(raw) ? raw : camelCase(raw)
}

/**
 * `path-to-regexp` (used by MSW/Express) only accepts `[A-Za-z0-9_]` in a parameter name — it
 * stops reading the name at the first other character (a hyphen, a dot, a `$`, ...), which either
 * misparses the route or throws "Missing parameter name". This is a narrower check than
 * {@link isValidVarName}: a `$`-prefixed name is a valid JS identifier but not a valid
 * `path-to-regexp` name.
 */
function isPathToRegexpSafe(name: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(name)
}

/**
 * Sanitizes a parameter name so it is safe to use as a `path-to-regexp` capture name, without
 * routing through {@link camelCase} (which keeps a leading `$` since it is a valid JS identifier
 * character). Runs of disallowed characters are treated as word boundaries; a boundary at the
 * very start of the name (e.g. the `$` in `$id`) still capitalizes the word that follows it.
 */
function transformPathParam(raw: string): string {
  if (isPathToRegexpSafe(raw)) {
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
 * Renders how a grouped `path` object's member is accessed: dot access for a valid
 * identifier, bracket access with the raw name otherwise.
 */
function groupedAccessor(name: string): string {
  return isValidVarName(name) ? `.${name}` : `[${JSON.stringify(name)}]`
}

function toParamsObject(path: string, { replacer }: { replacer?: (pathParam: string) => string } = {}): Record<string, string> | null {
  const params: Record<string, string> = {}

  for (const match of path.matchAll(/\{([^}]+)\}/g)) {
    const param = transformParam(match[1]!)
    const key = replacer ? replacer(param) : param
    params[key] = key
  }

  return Object.keys(params).length > 0 ? params : null
}

/**
 * Helpers for OpenAPI/Swagger paths, plus a thin wrapper over the native `URL`.
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
   * Converts an OpenAPI/Swagger path to a TypeScript template literal string.
   * `prefix` is prepended inside the literal, and `replacer` transforms each parameter name.
   *
   * @example
   * Url.toTemplateString('/pet/{petId}') // '`/pet/${petId}`'
   *
   * @example
   * Url.toTemplateString('/pet/{petId}', { prefix: 'https://api' }) // '`https://api/pet/${petId}`'
   */
  static toTemplateString(path: string, { prefix, replacer }: TemplateOptions = {}): string {
    const parts = path.split(/\{([^}]+)\}/)
    const result = parts
      .map((part, i) => {
        if (i % 2 === 0) return part
        const param = transformParam(part)
        return `\${${replacer ? replacer(param) : param}}`
      })
      .join('')

    return `\`${prefix ?? ''}${result}\``
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

  /**
   * Returns the path and its extracted params as a structured `URLObject`, or as a stringified
   * expression when `stringify` is set.
   *
   * @example
   * Url.toObject('/pet/{petId}')
   * // { url: '/pet/:petId', params: { petId: 'petId' } }
   */
  static toObject(path: string, { type = 'path', replacer, stringify }: ObjectOptions = {}): URLObject | string {
    const object: URLObject = {
      url: type === 'path' ? Url.toPath(path) : Url.toTemplateString(path, { replacer }),
      params: toParamsObject(path, { replacer }),
    }

    if (stringify) {
      if (type === 'template') {
        return JSON.stringify(object).replaceAll("'", '').replaceAll(`"`, '')
      }

      if (object.params) {
        return `{ url: '${object.url}', params: ${JSON.stringify(object.params).replaceAll("'", '').replaceAll(`"`, '')} }`
      }

      return `{ url: '${object.url}' }`
    }

    return object
  }
}
