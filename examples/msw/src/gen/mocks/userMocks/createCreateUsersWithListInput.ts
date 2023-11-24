import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import {
  CreateUsersWithListInputError,
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../models/CreateUsersWithListInput'

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
