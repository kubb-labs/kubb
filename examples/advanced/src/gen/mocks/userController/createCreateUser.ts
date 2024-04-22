import { createUser } from '../createUser'
import type { CreateUserError, CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/ts/userController/CreateUser'

/**
 * @description successful operation
 */
export function createCreateUserError(): NonNullable<CreateUserError> {
  return createUser()
}

/**
 * @description Created user object
 */
export function createCreateUserMutationRequest(): NonNullable<CreateUserMutationRequest> {
  return createUser()
}

export function createCreateUserMutationResponse(): NonNullable<CreateUserMutationResponse> {
  return undefined
}
