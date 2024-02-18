import type { User } from '../../models'

/**
 * @description successful operation
 */
export type CreateUserError = any | null

export type CreateUserMutationResponse = any | null

/**
 * @description Created user object
 */
export type CreateUserMutationRequest = User
export type CreateUserMutation = {
  Response: CreateUserMutationResponse
  Request: CreateUserMutationRequest
  Errors: CreateUserError
}
