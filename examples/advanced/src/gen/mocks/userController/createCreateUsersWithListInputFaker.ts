import type { CreateUsersWithListInputMutationRequest } from '../../models/ts/userController/CreateUsersWithListInput.ts'
import { createUserFaker } from '../createUserFaker.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInput200Faker() {
  return createUserFaker()
}

/**
 * @description successful operation
 */
export function createCreateUsersWithListInputErrorFaker() {
  return undefined
}

export function createCreateUsersWithListInputMutationRequestFaker(data: NonNullable<Partial<CreateUsersWithListInputMutationRequest>> = []) {
  return [...(faker.helpers.arrayElements([createUserFaker()]) as any), ...data]
}

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInputMutationResponseFaker() {
  return createUserFaker()
}
