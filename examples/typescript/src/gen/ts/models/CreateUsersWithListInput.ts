import type { User } from '../../models'

export type CreateUsersWithListInputMutationRequest = User[]

/**
 * @description Successful operation
 */
export type CreateUsersWithListInputMutationResponse = User
export type CreateUsersWithListInputMutation = {
  Response: CreateUsersWithListInputMutationResponse
  Request: CreateUsersWithListInputMutationRequest
}
