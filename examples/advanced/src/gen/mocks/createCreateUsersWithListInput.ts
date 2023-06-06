import { faker } from '@faker-js/faker'

import { createUser } from './createUser'

import type {
  CreateUsersWithListInputError,
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../models/ts/userController/CreateUsersWithListInput'

/**
 * @description successful operation
 */

export function createCreateUsersWithListInputError(): CreateUsersWithListInputError {
  return undefined
}

export function createCreateUsersWithListInputMutationRequest(): CreateUsersWithListInputMutationRequest {
  return faker.helpers.arrayElements([createUser()])
}

/**
 * @description Successful operation
 */

export function createCreateUsersWithListInputMutationResponse(): CreateUsersWithListInputMutationResponse {
  return createUser()
}
