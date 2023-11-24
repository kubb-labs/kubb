/**
 * @description Invalid username/password supplied
 */
export type LoginUser400 = any | null

export type LoginUserQueryParams = {
  /**
   * @description The user name for login
   * @type string | undefined
   */
  username?: string
  /**
   * @description The password for login in clear text
   * @type string | undefined
   */
  password?: string
}

/**
 * @description successful operation
 */
export type LoginUserQueryResponse = string
export namespace LoginUserQuery {
  export type Response = LoginUserQueryResponse
  export type QueryParams = LoginUserQueryParams
  export type Errors = LoginUser400
}
