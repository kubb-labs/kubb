import type { User } from './User'

/**
 * @description successful operation
 */
export type CreateUserError = User
/**
 * @description Created user object
 */
export type CreateUserMutationRequest = User
export type CreateUserMutationResponse = any
export type CreateUserMutation = {
  Response: CreateUserMutationResponse
  Request: CreateUserMutationRequest
}
