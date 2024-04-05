import { faker } from '@faker-js/faker'
import type { DeleteUser400, DeleteUser404, DeleteUserMutationResponse, DeleteUserPathParams } from '../../models/DeleteUser'

export function createDeleteUserPathParams(override: NonNullable<Partial<DeleteUserPathParams>> = {}): NonNullable<DeleteUserPathParams> {
  faker.seed([220])
  return {
    ...{ username: faker.string.alpha() },
    ...override,
  }
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
