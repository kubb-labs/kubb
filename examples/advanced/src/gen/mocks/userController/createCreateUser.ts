import { createUser } from '../createUser'
import type { CreateUserError, CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/ts/userController/CreateUser'

/**
 * @description successful operation
 */

export function createCreateUserError(override?: NonNullable<Partial<CreateUserError>>): NonNullable<CreateUserError> {
  return undefined
}

export function createCreateUserMutationResponse(override?: NonNullable<Partial<CreateUserMutationResponse>>): NonNullable<CreateUserMutationResponse> {
  return undefined
}
/**
 * @description Created user object
 */

export function createCreateUserMutationRequest(override?: NonNullable<Partial<CreateUserMutationRequest>>): NonNullable<CreateUserMutationRequest> {
  return createUser(override)
}
