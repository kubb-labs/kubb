import { createUser } from '../createUser'
import { CreateUserMutationResponse } from '../../models/CreateUser'
import { CreateUserError } from '../../models/CreateUser'
import { CreateUserMutationRequest } from '../../models/CreateUser'

export function createCreateUserMutationResponse(): NonNullable<CreateUserMutationResponse> {
  return undefined
}

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
