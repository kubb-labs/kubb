import type { CreateUsersWithListInputMutationRequest } from '../../models/CreateUsersWithListInput.ts'
import { createUser } from '../createUser.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInput200() {
  faker.seed([220])
  return createUser()
}

/**
 * @description successful operation
 */
export function createCreateUsersWithListInputError() {
  faker.seed([220])
  return undefined
}

export function createCreateUsersWithListInputMutationRequest() {
  faker.seed([220])
  return faker.helpers.multiple(() => createUser()) as any
}

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInputMutationResponse() {
  faker.seed([220])
  return createUser()
}
