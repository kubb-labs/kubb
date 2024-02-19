import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/CreateUser'

export function createCreateUserMutationResponse(override?: NonNullable<Partial<CreateUserMutationResponse>>): NonNullable<CreateUserMutationResponse> {
  faker.seed([220])
  return undefined
}

/**
 * @description Created user object
 */

export function createCreateUserMutationRequest(override?: NonNullable<Partial<CreateUserMutationRequest>>): NonNullable<CreateUserMutationRequest> {
  faker.seed([220])
  return createUser(override)
}
