import { camelCase, camelCaseTransformMerge } from 'change-case'

export class Path {
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
    const regex = /{(\w|-)*}/g
    const found = this.path.match(regex)
    let newPath = this.path.replaceAll('{', '${')

    if (found) {
      newPath = found.reduce((prev, curr) => {
        const replacement = `\${${camelCase(curr, { delimiter: '', transform: camelCaseTransformMerge })}}`

        return prev.replace(curr, replacement)
      }, this.path)
    }

    return `\`${newPath}\``
  }

  /**
   * Convert Swagger path to URLPath(syntax of Express)
   * @example /pet/{petId} => /pet/:petId
   */
  toURLPath(): string {
    return this.path.replaceAll('{', ':').replaceAll('}', '')
  }
}
