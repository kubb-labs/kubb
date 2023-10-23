/**
 * @description Invalid username supplied
 */
export type DeleteUser400 = any | null

/**
 * @description User not found
 */
export type DeleteUser404 = any | null

export type DeleteUserMutationResponse = any | null

export type DeleteUserPathParams = {
  /**
   * @description The name that needs to be deleted
   * @type string
   */
  username: string
}
