import { faker } from '@faker-js/faker'
import type { DeleteUserPathParams, DeleteUser400, DeleteUser404, DeleteUserMutationResponse } from '../../models/DeleteUser'

export function createDeleteUserPathParams(): NonNullable<DeleteUserPathParams> {
  faker.seed([220])
  return { username: faker.string.alpha() }
}

/**
 * @description Invalid username supplied
 */
export function createDeleteUser400(): NonNullable<DeleteUser400> {
  faker.seed([220])
  return undefined
}

/**
 * @description User not found
 */
export function createDeleteUser404(): NonNullable<DeleteUser404> {
  faker.seed([220])
  return undefined
}

export function createDeleteUserMutationResponse(): NonNullable<DeleteUserMutationResponse> {
  faker.seed([220])
  return undefined
}
