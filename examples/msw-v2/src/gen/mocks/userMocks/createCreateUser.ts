import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import { CreateUserError, CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/CreateUser'

/**
 * @description successful operation
 */
export function createCreateUserError(override?: NonNullable<Partial<CreateUserError>>): NonNullable<CreateUserError> {
  faker.seed([220])
  return createUser(override)
}

/**
 * @description Created user object
 */
export function createCreateUserMutationRequest(override?: NonNullable<Partial<CreateUserMutationRequest>>): NonNullable<CreateUserMutationRequest> {
  faker.seed([220])
  return createUser(override)
}

export function createCreateUserMutationResponse(override?: NonNullable<Partial<CreateUserMutationResponse>>): NonNullable<CreateUserMutationResponse> {
  faker.seed([220])
  return undefined
}
