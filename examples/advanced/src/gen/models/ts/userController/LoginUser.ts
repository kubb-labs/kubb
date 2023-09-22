/**
 * LoginUser400
 * LoginUser400
 * @description Invalid username/password supplied
 */
export type LoginUser400 = any | null

/**
 * LoginUserQueryResponse
 * LoginUserQueryResponse
 * @description successful operation
 */
export type LoginUserQueryResponse = string

export type LoginuserQueryparams = {
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
