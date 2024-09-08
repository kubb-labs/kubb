import type { CreateUsersWithListInputMutationRequest } from '../../models/ts/userController/CreateUsersWithListInput.ts'
import { createUser } from '../createUser.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInput200() {
  return createUser()
}

/**
 * @description successful operation
 */
export function createCreateUsersWithListInputError() {
  return undefined
}

export function createCreateUsersWithListInputMutationRequest(data: NonNullable<Partial<CreateUsersWithListInputMutationRequest>> = []) {
  return [...(faker.helpers.arrayElements([createUser()]) as any), ...data]
}

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInputMutationResponse() {
  return createUser()
}
