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

    return this
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
    const regex = /{(\w|-)*}/g
    const found = this.path.match(regex)
    let newPath = this.path.replaceAll('{', '${')

    if (found) {
      newPath = found.reduce((prev, path) => {
        const pathWithoutBrackets = path.replaceAll('{', '').replaceAll('}', '')

        let param = isValidVarName(pathWithoutBrackets) ? pathWithoutBrackets : camelCase(pathWithoutBrackets)

        if (this.#options.casing === 'camelcase') {
          param = camelCase(param)
        }

        return prev.replace(path, `\${${replacer ? replacer(param) : param}}`)
      }, this.path)
    }

    return `\`${prefix}${newPath}\``
  }

  getParams(replacer?: (pathParam: string) => string): Record<string, string> | undefined {
    const regex = /{(\w|-)*}/g
    const found = this.path.match(regex)

    if (!found) {
      return undefined
    }

    const params: Record<string, string> = {}
    found.forEach((item) => {
      item = item.replaceAll('{', '').replaceAll('}', '')

      let param = isValidVarName(item) ? item : camelCase(item)

      if (this.#options.casing === 'camelcase') {
        param = camelCase(param)
      }

      const key = replacer ? replacer(param) : param

      params[key] = key
    }, this.path)

    return params
  }

  /**
   * Convert Swagger path to URLPath(syntax of Express)
   * @example /pet/{petId} => /pet/:petId
   */
  toURLPath(): string {
    return this.path.replaceAll('{', ':').replaceAll('}', '')
  }
}
