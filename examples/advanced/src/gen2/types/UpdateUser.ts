import type { User } from './User.ts'

export type UpdateUserPathParams = {
  /**
   * @description name that need to be deleted
   * @type string
   */
  username: string
}

/**
 * @description successful operation
 */
export type UpdateUserError = any

/**
 * @description Update an existent user in the store
 */
export type UpdateUserMutationRequest = Omit<NonNullable<User>, 'tag'>

export type UpdateUserMutationResponse = any

export type UpdateUserMutation = {
  Response: any
  Request: UpdateUserMutationRequest
  PathParams: UpdateUserPathParams
  Errors: any
}
