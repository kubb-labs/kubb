import type { CreateUserError, CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/ts/userController/CreateUser.ts'
import { createUserFaker } from '../createUserFaker.ts'

/**
 * @description successful operation
 */
export function createCreateUserErrorFaker(data?: Partial<CreateUserError>): CreateUserError {
  return createUserFaker(data)
}

/**
 * @description Created user object
 */
export function createCreateUserMutationRequestFaker(data?: Partial<CreateUserMutationRequest>): CreateUserMutationRequest {
  return createUserFaker(data)
}

export function createCreateUserMutationResponseFaker(_data?: Partial<CreateUserMutationResponse>): CreateUserMutationResponse {
  return undefined
}
