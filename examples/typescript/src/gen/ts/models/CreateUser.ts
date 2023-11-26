import type { User } from '../../models'

export type CreateUserMutationResponse = any | null

/**
 * @description successful operation
 */
export type CreateUserError = User

/**
 * @description Created user object
 */
export type CreateUserMutationRequest = User
export namespace CreateUserMutation {
  export type Response = CreateUserMutationResponse
  export type Request = CreateUserMutationRequest
  export type Errors = CreateUserError
}
