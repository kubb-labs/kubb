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
export type DeleteUserStatus400 = any

/**
 * @description User not found
 */
export type DeleteUserStatus404 = any

export type DeleteUserRequest = {
  data?: never
  pathParams: DeleteUserPathParams
  queryParams?: never
  headerParams?: never
  url: '/user/{username}'
}

export type DeleteUserResponseData = any
