import type { DeleteUserPathParams, DeleteUser400, DeleteUser404, DeleteUserMutationResponse } from '../../models/ts/userController/DeleteUser.ts'
import { faker } from '@faker-js/faker'

export function createDeleteUserPathParams(data: NonNullable<Partial<DeleteUserPathParams>> = {}): NonNullable<DeleteUserPathParams> {
  return {
    ...{ username: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description Invalid username supplied
 */
export function createDeleteUser400(): NonNullable<DeleteUser400> {
  return undefined
}

/**
 * @description User not found
 */
export function createDeleteUser404(): NonNullable<DeleteUser404> {
  return undefined
}

export function createDeleteUserMutationResponse(): NonNullable<DeleteUserMutationResponse> {
  return undefined
}
