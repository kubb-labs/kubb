import { createUser } from '../createUser'
import type { CreateUserError, CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/CreateUser'

export function createCreateUserMutationResponse(override?: Partial<CreateUserMutationResponse>): NonNullable<CreateUserMutationResponse> {
  return undefined
}
/**
 * @description successful operation
 */

export function createCreateUserError(override?: Partial<CreateUserError>): NonNullable<CreateUserError> {
  return createUser(override)
}
/**
 * @description Created user object
 */

export function createCreateUserMutationRequest(override?: Partial<CreateUserMutationRequest>): NonNullable<CreateUserMutationRequest> {
  return createUser(override)
}
