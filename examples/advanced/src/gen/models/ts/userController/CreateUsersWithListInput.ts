import type { User } from '../User.ts'

/**
 * @description Successful operation
 */
export type CreateUsersWithListInput200 = User

/**
 * @description successful operation
 */
export type CreateUsersWithListInputError = any

export type CreateUsersWithListInputMutationRequest = Array<User>

export type CreateUsersWithListInputMutationResponse = CreateUsersWithListInput200

export type CreateUsersWithListInputMutation = {
  /**
   * @type object
   */
  Response: CreateUsersWithListInput200
  /**
   * @type object
   */
  Request: CreateUsersWithListInputMutationRequest
  /**
   * @type object
   */
  Errors: CreateUsersWithListInputError
}
