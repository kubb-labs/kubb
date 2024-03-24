import type { User } from '../User'

export type CreateUserMutationResponse = any

/**
 * @description Created user object
 */
export type CreateUserMutationRequest = User

/**
 * @description successful operation
 */
export type CreateUserError = User

export type CreateUserMutation = {
  Response: CreateUserMutationResponse
  Request: CreateUserMutationRequest
}
