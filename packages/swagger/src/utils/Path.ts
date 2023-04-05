export class Path {
  path: string

  constructor(path: string) {
    this.path = path
  }

  /**
   * Convert Swagger path to URLPath(syntax of Express)
   * @example /pet/{petId} => /pet/:petId
   */
  get URL() {
    return this.toURLPath()
  }

  /**
   * Convert Swagger path to template literals/ template strings
   * @example /pet/{petId} => `/pet/${petId}`
   */
  get template() {
    return this.toTemplateString()
  }

  /**
   * Convert Swagger path to template literals/ template strings
   * @example /pet/{petId} => `/pet/${petId}`
   */
  toTemplateString() {
    const newPath = this.path.replaceAll('{', '${')

    return `\`${newPath}\``
  }

  /**
   * Convert Swagger path to URLPath(syntax of Express)
   * @example /pet/{petId} => /pet/:petId
   */
  toURLPath() {
    return this.path.replaceAll('{', ':').replaceAll('}', '')
  }
}
