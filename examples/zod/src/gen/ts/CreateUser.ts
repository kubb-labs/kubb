import type { CreateUserResult } from './CreateUserResult'

export type CreateUser = {
  /**
   * @type string | undefined
   */
  email?: string
}

/**
 * @description OK
 */
export type CreateUser201 = CreateUserResult

export type CreateUserMutationRequest = {
  /**
   * @type string
   */
  name: string
}

/**
 * @description OK
 */
export type CreateUserMutationResponse = CreateUserResult
export type CreateUserMutation = {
  Response: CreateUserMutationResponse
  Request: CreateUserMutationRequest
}
