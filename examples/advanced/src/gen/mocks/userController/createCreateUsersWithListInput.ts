import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import type {
  CreateUsersWithListInput200,
  CreateUsersWithListInputError,
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../models/ts/userController/CreateUsersWithListInput'

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInput200(): NonNullable<CreateUsersWithListInput200> {
  return createUser()
}

/**
 * @description successful operation
 */
export function createCreateUsersWithListInputError(): NonNullable<CreateUsersWithListInputError> {
  return undefined
}

export function createCreateUsersWithListInputMutationRequest(): NonNullable<CreateUsersWithListInputMutationRequest> {
  return faker.helpers.arrayElements([createUser()]) as any
}

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInputMutationResponse(): NonNullable<CreateUsersWithListInputMutationResponse> {
  return createUser()
}
