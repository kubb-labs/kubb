import { faker } from '@faker-js/faker'
import type { CreateUserError, CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/CreateUser'
import { createUser } from '../createUser'

/**
 * @description successful operation
 */
export function createCreateUserError(): NonNullable<CreateUserError> {
  faker.seed([220])
  return createUser()
}

/**
 * @description Created user object
 */
export function createCreateUserMutationRequest(): NonNullable<CreateUserMutationRequest> {
  faker.seed([220])
  return createUser()
}

export function createCreateUserMutationResponse(): NonNullable<CreateUserMutationResponse> {
  faker.seed([220])
  return undefined
}
