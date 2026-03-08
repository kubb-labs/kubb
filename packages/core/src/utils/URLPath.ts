import { camelCase, isValidVarName } from '../transformers'

export type URLObject = {
  url: string
  params?: Record<string, string>
}

type ObjectOptions = {
  type?: 'path' | 'template'
  replacer?: (pathParam: string) => string
  stringify?: boolean
}

type Options = {
  casing?: 'camelcase'
}

export class URLPath {
  path: string
  #options: Options

  constructor(path: string, options: Options = {}) {
    this.path = path
    this.#options = options
  }

  /**
   * Convert Swagger path to URLPath(syntax of Express)
   * @example /pet/{petId} => /pet/:petId
   */
  get URL(): string {
    return this.toURLPath()
  }
  get isURL(): boolean {
    try {
      const url = new URL(this.path)
      if (url?.href) {
        return true
      }
    } catch (_error) {
      return false
    }
    return false
  }

  /**
   * Convert Swagger path to template literals/ template strings(camelcase)
   * @example /pet/{petId} => `/pet/${petId}`
   * @example /account/monetary-accountID => `/account/${monetaryAccountId}`
   * @example /account/userID => `/account/${userId}`
   */
  get template(): string {
    return this.toTemplateString()
  }
  get object(): URLObject | string {
    return this.toObject()
  }
  get params(): Record<string, string> | undefined {
    return this.getParams()
  }

  #transformParam(raw: string): string {
    let param = isValidVarName(raw) ? raw : camelCase(raw)
    if (this.#options.casing === 'camelcase') {
      param = camelCase(param)
    }
    return param
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
   * Convert Swagger path to template literals/ template strings(camelcase)
   * @example /pet/{petId} => `/pet/${petId}`
   * @example /account/monetary-accountID => `/account/${monetaryAccountId}`
   * @example /account/userID => `/account/${userId}`
   */
  toTemplateString({ prefix = '', replacer }: { prefix?: string; replacer?: (pathParam: string) => string } = {}): string {
    const path = this.path
    let result = ''
    let i = 0

    while (i < path.length) {
      const start = path.indexOf('{', i)
      if (start === -1) {
        result += path.slice(i)
        break
      }
      result += path.slice(i, start)
      const end = path.indexOf('}', start + 1)
      if (end === -1) {
        result += path.slice(start)
        break
      }
      const raw = path.slice(start + 1, end)
      const param = this.#transformParam(raw)
      result += `\${${replacer ? replacer(param) : param}}`
      i = end + 1
    }

    return `\`${prefix}${result}\``
  }

  getParams(replacer?: (pathParam: string) => string): Record<string, string> | undefined {
    const path = this.path
    const params: Record<string, string> = {}
    let hasParam = false
    let i = 0

    while (i < path.length) {
      const start = path.indexOf('{', i)
      if (start === -1) break
      const end = path.indexOf('}', start + 1)
      if (end === -1) break
      const raw = path.slice(start + 1, end)
      const param = this.#transformParam(raw)
      const key = replacer ? replacer(param) : param
      params[key] = key
      hasParam = true
      i = end + 1
    }

    return hasParam ? params : undefined
  }

  /**
   * Convert Swagger path to URLPath(syntax of Express)
   * @example /pet/{petId} => /pet/:petId
   */
  toURLPath(): string {
    return this.path.replaceAll('{', ':').replaceAll('}', '')
  }
}
