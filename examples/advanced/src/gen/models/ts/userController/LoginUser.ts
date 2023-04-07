export type LoginUserQueryParams = {
  /**
   * @type string | undefined
   */
  username?: string | undefined
  /**
   * @type string | undefined
   */
  password?: string | undefined
}

/**
 * @description successful operation
 */
export type LoginUserResponse = string

/**
 * @description Invalid username/password supplied
 */
export type LoginUser400 = any | null
