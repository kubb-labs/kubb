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
export type LoginUser200 = string
/**
 * @description Invalid username/password supplied
 */
export type LoginUser400 = any
/**
 * @description successful operation
 */
export type LoginUserQueryResponse = string
export type LoginUserQuery = {
  Response: LoginUserQueryResponse
  QueryParams: LoginUserQueryParams
  Errors: LoginUser400
}
