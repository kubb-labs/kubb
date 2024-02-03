import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import type { CreateUserError, CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/CreateUser'

export function createCreateUserMutationResponse(override?: Partial<CreateUserMutationResponse>): NonNullable<CreateUserMutationResponse> {
  faker.seed([220])
  return undefined
}
/**
 * @description successful operation
 */

export function createCreateUserError(override?: Partial<CreateUserError>): NonNullable<CreateUserError> {
  faker.seed([220])
  return createUser(override)
}
/**
 * @description Created user object
 */

export function createCreateUserMutationRequest(override?: Partial<CreateUserMutationRequest>): NonNullable<CreateUserMutationRequest> {
  faker.seed([220])
  return createUser(override)
}
