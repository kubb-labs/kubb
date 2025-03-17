// version: 1.0.11
import type { User } from './User.ts'

/**
 * @description Successful operation
 */
export type CreateUsersWithListInput200 = User

/**
 * @description successful operation
 */
export type CreateUsersWithListInputError = any

export type CreateUsersWithListInputMutationRequest = User[]

export type CreateUsersWithListInputMutationResponse = CreateUsersWithListInput200

export type CreateUsersWithListInputMutation = {
  Response: CreateUsersWithListInput200
  Request: CreateUsersWithListInputMutationRequest
  Errors: any
}
