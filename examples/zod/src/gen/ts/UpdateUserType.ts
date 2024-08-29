import type { UserType } from './UserType.ts'

export type UpdateUserPathParamsType = {
  /**
   * @description name that need to be deleted
   * @type string
   */
  username: string
}

/**
 * @description successful operation
 */
export type UpdateUserErrorType = any

/**
 * @description Update an existent user in the store
 */
export type UpdateUserMutationRequestType = UserType

export type UpdateUserMutationResponseType = any

export type UpdateUserTypeMutation = {
  Response: UpdateUserMutationResponseType
  Request: UpdateUserMutationRequestType
  PathParams: UpdateUserPathParamsType
}
