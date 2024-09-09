import type { DeleteUserPathParams } from '../../models/ts/userController/DeleteUser.ts'
import { faker } from '@faker-js/faker'

export function createDeleteUserPathParams(data: NonNullable<Partial<DeleteUserPathParams>> = {}) {
  return {
    ...{ username: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description Invalid username supplied
 */
export function createDeleteUser400() {
  return undefined
}

/**
 * @description User not found
 */
export function createDeleteUser404() {
  return undefined
}

export function createDeleteUserMutationResponse() {
  return undefined
}
