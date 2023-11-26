import type { User } from '../../models'

/**
 * @description successful operation
 */
export type CreateUsersWithListInputError = any | null

export type CreateUsersWithListInputMutationRequest = User[]

/**
 * @description Successful operation
 */
export type CreateUsersWithListInputMutationResponse = User
export namespace CreateUsersWithListInputMutation {
  export type Response = CreateUsersWithListInputMutationResponse
  export type Request = CreateUsersWithListInputMutationRequest
  export type Errors = CreateUsersWithListInputError
}
