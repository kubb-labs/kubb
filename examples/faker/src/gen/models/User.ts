export type User = {
  /**
   * @type integer | undefined int64
   * @example 10
   */
  id?: number
  /**
   * @type string | undefined
   * @example theUser
   */
  username?: string
  /**
   * @type string | undefined
   * @example John
   */
  firstName?: string
  /**
   * @type string | undefined
   * @example James
   */
  lastName?: string
  /**
   * @type string | undefined
   * @example john@email.com
   */
  email?: string
  /**
   * @type string | undefined
   * @example 12345
   */
  password?: string
  /**
   * @type string | undefined
   * @example 12345
   */
  phone?: string
  /**
   * @description User Status
   * @type integer | undefined int32
   * @example 1
   */
  userStatus?: number
}
