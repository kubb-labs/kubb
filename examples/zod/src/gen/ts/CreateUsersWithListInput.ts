import type { User } from './User'

/**
 * @description successful operation
 */
export type CreateUsersWithListInputError = User

export type CreateUsersWithListInputMutationRequest = User[]

/**
 * @description Successful operation
 */
export type CreateUsersWithListInputMutationResponse = User
export type CreateUsersWithListInputMutation = {
  Response: CreateUsersWithListInputMutationResponse
  Request: CreateUsersWithListInputMutationRequest
  Errors: CreateUsersWithListInputError
}
