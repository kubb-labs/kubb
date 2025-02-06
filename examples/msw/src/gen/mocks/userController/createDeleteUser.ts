import type { DeleteUserPathParams } from '../../models/DeleteUser.ts'
import { faker } from '@faker-js/faker'

export function createDeleteUserPathParams(data?: Partial<DeleteUserPathParams>): Partial<DeleteUserPathParams> {
  faker.seed([220])
  return {
    ...{ username: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description Invalid username supplied
 */
export function createDeleteUser400() {
  faker.seed([220])
  return undefined
}

/**
 * @description User not found
 */
export function createDeleteUser404() {
  faker.seed([220])
  return undefined
}

export function createDeleteUserMutationResponse() {
  faker.seed([220])
  return undefined
}
