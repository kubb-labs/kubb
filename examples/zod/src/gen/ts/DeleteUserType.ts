export type DeleteUserPathParamsType = {
  /**
   * @description The name that needs to be deleted
   * @type string
   */
  username: string
}

/**
 * @description Invalid username supplied
 */
export type DeleteUser400Type = any

/**
 * @description User not found
 */
export type DeleteUser404Type = any

export type DeleteUserMutationResponseType = any

export type DeleteUserTypeMutation = {
  Response: DeleteUserMutationResponseType
  PathParams: DeleteUserPathParamsType
  Errors: DeleteUser400Type | DeleteUser404Type
}
