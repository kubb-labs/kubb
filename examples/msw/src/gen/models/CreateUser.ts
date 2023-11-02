import type { User } from './User'

export type CreateUserMutationResponse = any | null

/**
 * @description successful operation
 */
export type CreateUserError = User

/**
 * @description Created user object
 */
export type CreateUserMutationRequest = User

export type CreateUser = {
  response: CreateUserMutationResponse
  request: CreateUserMutationRequest
  errors: CreateUserError
}
