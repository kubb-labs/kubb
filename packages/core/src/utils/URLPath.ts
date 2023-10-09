import { camelCase, camelCaseTransformMerge } from 'change-case'

type URLObject = {
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
  }

  /**
   * Convert Swagger path to URLPath(syntax of Express)
   * @example /pet/{petId} => /pet/:petId
   */
  get URL(): string {
    return this.toURLPath()
  }
  get isUrl(): boolean {
    return URLPath.isURL(this.path)
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

  toObject(options: ObjectOptions = {}): URLObject | string {
    return URLPath.toObject(this.path, options)
  }

  /**
   * Convert Swagger path to template literals/ template strings(camelcase)
   * @example /pet/{petId} => `/pet/${petId}`
   * @example /account/monetary-accountID => `/account/${monetaryAccountId}`
   * @example /account/userID => `/account/${userId}`
   */
  toTemplateString(replacer?: (pathParam: string) => string): string {
    return URLPath.toTemplateString(this.path, replacer)
  }
  /**
   * Convert Swagger path to template literals/ template strings(camelcase)
   * @example /pet/{petId} => `/pet/${petId}`
   * @example /account/monetary-accountID => `/account/${monetaryAccountId}`
   * @example /account/userID => `/account/${userId}`
   */
  static toTemplateString(path: string, replacer?: (pathParam: string) => string): string {
    const regex = /{(\w|-)*}/g
    const found = path.match(regex)
    let newPath = path.replaceAll('{', '${')

    if (found) {
      newPath = found.reduce((prev, curr) => {
        const pathParam = replacer
          ? replacer(camelCase(curr, { delimiter: '', transform: camelCaseTransformMerge }))
          : camelCase(curr, { delimiter: '', transform: camelCaseTransformMerge })
        const replacement = `\${${pathParam}}`

        return prev.replace(curr, replacement)
      }, path)
    }

    return `\`${newPath}\``
  }

  getParams(replacer?: (pathParam: string) => string): Record<string, string> | undefined {
    return URLPath.getParams(this.path, replacer)
  }

  static getParams(path: string, replacer?: (pathParam: string) => string): Record<string, string> | undefined {
    const regex = /{(\w|-)*}/g
    const found = path.match(regex)

    if (!found) {
      return undefined
    }

    const params: Record<string, string> = {}
    found.forEach((item) => {
      item = item.replaceAll('{', '').replaceAll('}', '')

      const pathParam = replacer
        ? replacer(camelCase(item, { delimiter: '', transform: camelCaseTransformMerge }))
        : camelCase(item, { delimiter: '', transform: camelCaseTransformMerge })

      params[pathParam] = pathParam
    }, path)

    return params
  }

  /**
   * Convert Swagger path to URLPath(syntax of Express)
   * @example /pet/{petId} => /pet/:petId
   */
  toURLPath(): string {
    return URLPath.toURLPath(this.path)
  }

  static toURLPath(path: string): string {
    return path.replaceAll('{', ':').replaceAll('}', '')
  }

  static toObject(path: string, { type = 'path', replacer, stringify }: ObjectOptions = {}): URLObject | string {
    const object = {
      url: type === 'path' ? URLPath.toURLPath(path) : URLPath.toTemplateString(path, replacer),
      params: URLPath.getParams(path),
    }

    if (stringify) {
      if (type !== 'template') {
        throw new Error('Type should be `template` when using stringiyf')
      }
      return JSON.stringify(object).replaceAll("'", '').replaceAll(`"`, '')
    }

    return object
  }

  static isURL(path: string): boolean {
    try {
      const url = new URL(path)
      if (url?.href) {
        return true
      }
    } catch (error) {
      return false
    }
    return false
  }
}
