import { camelCase, camelCaseTransformMerge } from 'change-case'

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

  /**
   * Convert Swagger path to template literals/ template strings(camelcase)
   * @example /pet/{petId} => `/pet/${petId}`
   * @example /account/monetary-accountID => `/account/${monetaryAccountId}`
   * @example /account/userID => `/account/${userId}`
   */
  toTemplateString(): string {
    return URLPath.toTemplateString(this.path)
  }
  /**
   * Convert Swagger path to template literals/ template strings(camelcase)
   * @example /pet/{petId} => `/pet/${petId}`
   * @example /account/monetary-accountID => `/account/${monetaryAccountId}`
   * @example /account/userID => `/account/${userId}`
   */
  static toTemplateString(path: string): string {
    const regex = /{(\w|-)*}/g
    const found = path.match(regex)
    let newPath = path.replaceAll('{', '${')

    if (found) {
      newPath = found.reduce((prev, curr) => {
        const replacement = `\${${camelCase(curr, { delimiter: '', transform: camelCaseTransformMerge })}}`

        return prev.replace(curr, replacement)
      }, path)
    }

    return `\`${newPath}\``
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
