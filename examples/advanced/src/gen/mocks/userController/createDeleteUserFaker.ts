import type { DeleteUserPathParams } from '../../models/ts/userController/DeleteUser.js'
import { faker } from '@faker-js/faker'

export function createDeleteUserPathParamsFaker(data: NonNullable<Partial<DeleteUserPathParams>> = {}) {
  return {
    ...{ username: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description Invalid username supplied
 */
export function createDeleteUser400Faker() {
  return undefined
}

/**
 * @description User not found
 */
export function createDeleteUser404Faker() {
  return undefined
}

export function createDeleteUserMutationResponseFaker() {
  return undefined
}
