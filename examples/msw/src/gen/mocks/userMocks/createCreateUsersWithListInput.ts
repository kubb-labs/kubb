import { faker } from '@faker-js/faker'

import { CreateUsersWithListInputError } from '../../models/CreateUsersWithListInput'
import { CreateUsersWithListInputMutationRequest } from '../../models/CreateUsersWithListInput'
import { CreateUsersWithListInputMutationResponse } from '../../models/CreateUsersWithListInput'
import { createUser } from '../createUser'

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
