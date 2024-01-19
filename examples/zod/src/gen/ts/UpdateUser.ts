import type { User } from './User'

/**
 * @description successful operation
 */
export type UpdateUserError = any | null

export type UpdateUserMutationResponse = any | null

export type UpdateUserPathParams = {
  /**
   * @description name that need to be deleted
   * @type string
   */
  username: string
}

/**
 * @description Update an existent user in the store
 */
export type UpdateUserMutationRequest = User
export namespace UpdateUserMutation {
  export type Response = UpdateUserMutationResponse
  export type Request = UpdateUserMutationRequest
  export type PathParams = UpdateUserPathParams
  export type Errors = UpdateUserError
}
