import { camelCase } from './casing.ts'
import { isValidVarName } from './reserved.ts'

export type URLObject = {
  /**
   * The resolved URL string (Express-style or template literal, depending on context).
   */
  url: string
  /**
   * Extracted path parameters as a key-value map, or `null` when the path has none.
   */
  params: Record<string, string> | null
}

/**
 * Supported identifier casing strategies for path parameters.
 */
export type PathCasing = 'camelcase'

type TemplateOptions = {
  /**
   * Literal text prepended inside the template literal, e.g. a base URL.
   */
  prefix?: string | null
  /**
   * Transform applied to each extracted parameter name before interpolation.
   */
  replacer?: (pathParam: string) => string
  /**
   * Casing strategy applied to path parameter names.
   */
  casing?: PathCasing
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
  /**
   * Casing strategy applied to path parameter names.
   */
  casing?: PathCasing
}

function transformParam(raw: string, casing?: PathCasing): string {
  const param = isValidVarName(raw) ? raw : camelCase(raw)
  return casing === 'camelcase' ? camelCase(param) : param
}

function toParamsObject(
  path: string,
  { replacer, casing }: { replacer?: (pathParam: string) => string; casing?: PathCasing } = {},
): Record<string, string> | null {
  const params: Record<string, string> = {}

  for (const match of path.matchAll(/\{([^}]+)\}/g)) {
    const param = transformParam(match[1]!, casing)
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
   * Reports whether `url` is a parseable absolute URL. Delegates to the native `URL.canParse`.
   *
   * @example
   * Url.canParse('https://petstore.swagger.io/v2') // true
   * Url.canParse('/pet/{petId}')                   // false
   */
  static canParse(url: string, base?: string | URL): boolean {
    return URL.canParse(url, base)
  }

  /**
   * Converts an OpenAPI/Swagger path to Express-style colon syntax.
   *
   * @example
   * Url.toPath('/pet/{petId}') // '/pet/:petId'
   */
  static toPath(path: string): string {
    return path.replace(/\{([^}]+)\}/g, ':$1')
  }

  /**
   * Converts an OpenAPI/Swagger path to a TypeScript template literal string.
   * `prefix` is prepended inside the literal, `replacer` transforms each parameter name,
   * and `casing` controls parameter identifier casing.
   *
   * @example
   * Url.toTemplateString('/pet/{petId}') // '`/pet/${petId}`'
   *
   * @example
   * Url.toTemplateString('/pet/{petId}', { prefix: 'https://api' }) // '`https://api/pet/${petId}`'
   */
  static toTemplateString(path: string, { prefix, replacer, casing }: TemplateOptions = {}): string {
    const parts = path.split(/\{([^}]+)\}/)
    const result = parts
      .map((part, i) => {
        if (i % 2 === 0) return part
        const param = transformParam(part, casing)
        return `\${${replacer ? replacer(param) : param}}`
      })
      .join('')

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
  static toObject(path: string, { type = 'path', replacer, stringify, casing }: ObjectOptions = {}): URLObject | string {
    const object: URLObject = {
      url: type === 'path' ? Url.toPath(path) : Url.toTemplateString(path, { replacer, casing }),
      params: toParamsObject(path, { replacer, casing }),
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
