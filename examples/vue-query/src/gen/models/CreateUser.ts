import type { User } from './User.ts'

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
  Response: any
  Request: CreateUserMutationRequest
  Errors: any
}