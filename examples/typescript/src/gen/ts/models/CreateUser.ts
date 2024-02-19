import type { User } from '../../models'

export type CreateUserMutationResponse = any | null

/**
 * @description Created user object
 */
export type CreateUserMutationRequest = User
export type CreateUserMutation = {
  Response: CreateUserMutationResponse
  Request: CreateUserMutationRequest
}
