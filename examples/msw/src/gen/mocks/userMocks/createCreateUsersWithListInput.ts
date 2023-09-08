import { faker } from '@faker-js/faker'

import { createUser } from '../createUser'
import { CreateUsersWithListInputError } from '../../models/CreateUsersWithListInput'
import { CreateUsersWithListInputMutationRequest } from '../../models/CreateUsersWithListInput'
import { CreateUsersWithListInputMutationResponse } from '../../models/CreateUsersWithListInput'

/**
 * @description successful operation
 */

export function createCreateUsersWithListInputError(): CreateUsersWithListInputError {
  return undefined
}

export function createCreateUsersWithListInputMutationRequest(): CreateUsersWithListInputMutationRequest {
  return faker.helpers.arrayElements([createUser()]) as any
}

/**
 * @description Successful operation
 */

export function createCreateUsersWithListInputMutationResponse(): CreateUsersWithListInputMutationResponse {
  return createUser()
}
