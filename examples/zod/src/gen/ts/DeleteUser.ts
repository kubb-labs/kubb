export type DeleteUserPathParams = {
  /**
   * @description The name that needs to be deleted
   * @type string
   */
  username: string
}
/**
 * @description Invalid username supplied
 */
export type DeleteUser400 = any
/**
 * @description User not found
 */
export type DeleteUser404 = any
export type DeleteUserMutationResponse = any
export type DeleteUserMutation = {
  Response: DeleteUserMutationResponse
  PathParams: DeleteUserPathParams
  Errors: DeleteUser400 | DeleteUser404
}
