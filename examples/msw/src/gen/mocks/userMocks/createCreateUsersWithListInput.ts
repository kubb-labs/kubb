import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import type {
  CreateUsersWithListInput200,
  CreateUsersWithListInputError,
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../models/CreateUsersWithListInput'

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInput200(): NonNullable<CreateUsersWithListInput200> {
  faker.seed([220])
  return createUser()
}

/**
 * @description successful operation
 */
export function createCreateUsersWithListInputError(): NonNullable<CreateUsersWithListInputError> {
  faker.seed([220])
  return undefined
}

export function createCreateUsersWithListInputMutationRequest(): NonNullable<CreateUsersWithListInputMutationRequest> {
  faker.seed([220])
  return faker.helpers.arrayElements([createUser()]) as any
}

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInputMutationResponse(): NonNullable<CreateUsersWithListInputMutationResponse> {
  faker.seed([220])
  return createUser()
}
