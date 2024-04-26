import { camelCase } from '../transformers/casing.ts'

export type URLObject = {
  url: string
  params?: Record<string, string>
}

type ObjectOptions = {
  type?: 'path' | 'template'
  replacer?: (pathParam: string) => string
  stringify?: boolean
}

export class URLPath {
  path: string

  constructor(path: string) {
    this.path = path

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
    } catch (error) {
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
      url: type === 'path' ? this.toURLPath() : this.toTemplateString(replacer),
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
  toTemplateString(replacer?: (pathParam: string) => string): string {
    const regex = /{(\w|-)*}/g
    const found = this.path.match(regex)
    let newPath = this.path.replaceAll('{', '${')

    if (found) {
      newPath = found.reduce((prev, curr) => {
        const pathParam = replacer ? replacer(camelCase(curr)) : camelCase(curr)
        const replacement = `\${${pathParam}}`

        return prev.replace(curr, replacement)
      }, this.path)
    }

    return `\`${newPath}\``
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

      const pathParam = replacer ? replacer(camelCase(item)) : camelCase(item)

      params[pathParam] = pathParam
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
