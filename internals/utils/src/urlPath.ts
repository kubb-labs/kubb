import { camelCase } from './casing.ts'
import { isValidVarName } from './reserved.ts'

export type URLObject = {
  /** The resolved URL string (Express-style or template literal, depending on context). */
  url: string
  /** Extracted path parameters as a key-value map, or `undefined` when the path has none. */
  params?: Record<string, string>
}

type ObjectOptions = {
  /** Controls whether the `url` is rendered as an Express path or a template literal. Defaults to `'path'`. */
  type?: 'path' | 'template'
  /** Optional transform applied to each extracted parameter name. */
  replacer?: (pathParam: string) => string
  /** When `true`, the result is serialized to a string expression instead of a plain object. */
  stringify?: boolean
}

/** Supported identifier casing strategies for path parameters. */
type PathCasing = 'camelcase'

type Options = {
  /** Casing strategy applied to path parameter names. Defaults to the original identifier. */
  casing?: PathCasing
}

/**
 * Parses and transforms an OpenAPI/Swagger path string into various URL formats.
 *
 * @example
 * const p = new URLPath('/pet/{petId}')
 * p.URL      // '/pet/:petId'
 * p.template // '`/pet/${petId}`'
 */
export class URLPath {
  /** The raw OpenAPI/Swagger path string, e.g. `/pet/{petId}`. */
  path: string

  #options: Options

  constructor(path: string, options: Options = {}) {
    this.path = path
    this.#options = options
  }

  /** Converts the OpenAPI path to Express-style colon syntax, e.g. `/pet/{petId}` → `/pet/:petId`. */
  get URL(): string {
    return this.toURLPath()
  }

  /** Returns `true` when `path` is a fully-qualified URL (e.g. starts with `https://`). */
  get isURL(): boolean {
    try {
      return !!new URL(this.path).href
    } catch {
      return false
    }
  }

  /**
   * Converts the OpenAPI path to a TypeScript template literal string.
   *
   * @example
   * new URLPath('/pet/{petId}').template              // '`/pet/${petId}`'
   * new URLPath('/account/monetary-accountID').template // '`/account/${monetaryAccountId}`'
   */
  get template(): string {
    return this.toTemplateString()
  }

  /** Returns the path and its extracted params as a structured `URLObject`, or as a stringified expression when `stringify` is set. */
  get object(): URLObject | string {
    return this.toObject()
  }

  /** Returns a map of path parameter names, or `undefined` when the path has no parameters. */
  get params(): Record<string, string> | undefined {
    return this.getParams()
  }

  #transformParam(raw: string): string {
    const param = isValidVarName(raw) ? raw : camelCase(raw)
    return this.#options.casing === 'camelcase' ? camelCase(param) : param
  }

  /** Iterates over every `{param}` token in `path`, calling `fn` with the raw token and transformed name. */
  #eachParam(fn: (raw: string, param: string) => void): void {
    for (const match of this.path.matchAll(/\{([^}]+)\}/g)) {
      const raw = match[1]!
      fn(raw, this.#transformParam(raw))
    }
  }

  toObject({ type = 'path', replacer, stringify }: ObjectOptions = {}): URLObject | string {
    const object = {
      url: type === 'path' ? this.toURLPath() : this.toTemplateString({ replacer }),
      params: this.getParams(),
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

  /**
   * Converts the OpenAPI path to a TypeScript template literal string.
   * An optional `replacer` can transform each extracted parameter name before interpolation.
   *
   * @example
   * new URLPath('/pet/{petId}').toTemplateString() // '`/pet/${petId}`'
   */
  toTemplateString({ prefix = '', replacer }: { prefix?: string; replacer?: (pathParam: string) => string } = {}): string {
    const parts = this.path.split(/\{([^}]+)\}/)
    const result = parts
      .map((part, i) => {
        if (i % 2 === 0) return part
        const param = this.#transformParam(part)
        return `\${${replacer ? replacer(param) : param}}`
      })
      .join('')

    return `\`${prefix}${result}\``
  }

  /**
   * Extracts all `{param}` segments from the path and returns them as a key-value map.
   * An optional `replacer` transforms each parameter name in both key and value positions.
   * Returns `undefined` when no path parameters are found.
   */
  getParams(replacer?: (pathParam: string) => string): Record<string, string> | undefined {
    const params: Record<string, string> = {}

    this.#eachParam((_raw, param) => {
      const key = replacer ? replacer(param) : param
      params[key] = key
    })

    return Object.keys(params).length > 0 ? params : undefined
  }

  /** Converts the OpenAPI path to Express-style colon syntax, e.g. `/pet/{petId}` → `/pet/:petId`. */
  toURLPath(): string {
    return this.path.replace(/\{([^}]+)\}/g, ':$1')
  }
}
