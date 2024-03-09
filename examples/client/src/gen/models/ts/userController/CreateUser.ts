import type { User } from '../User'

export type CreateUserMutationResponse = any

/**
 * @description successful operation
 */
export type CreateUserError = User

/**
 * @description Created user object
 */
export type CreateUserMutationRequest = User
export type CreateUserMutation = {
  Response: CreateUserMutationResponse
  Request: CreateUserMutationRequest
}
