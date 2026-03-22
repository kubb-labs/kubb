import type { User } from '../User.ts'

/**
 * @description successful operation
 */
export type CreateUserError = User

export type CreateUserMutationRequest = User

export type CreateUserMutationResponse = any

export type CreateUserMutation = {
  Response: any
  Request: CreateUserMutationRequest
  Errors: CreateUserError
}
