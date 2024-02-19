import { faker } from '@faker-js/faker'
import type { DeleteUser400, DeleteUser404, DeleteUserMutationResponse, DeleteUserPathParams } from '../../models/ts/userController/DeleteUser'

/**
 * @description Invalid username supplied
 */

export function createDeleteUser400(override?: NonNullable<Partial<DeleteUser400>>): NonNullable<DeleteUser400> {
  return undefined
}
/**
 * @description User not found
 */

export function createDeleteUser404(override?: NonNullable<Partial<DeleteUser404>>): NonNullable<DeleteUser404> {
  return undefined
}

export function createDeleteUserMutationResponse(override?: NonNullable<Partial<DeleteUserMutationResponse>>): NonNullable<DeleteUserMutationResponse> {
  return undefined
}

export function createDeleteUserPathParams(override: NonNullable<Partial<DeleteUserPathParams>> = {}): NonNullable<DeleteUserPathParams> {
  return {
    ...{ 'username': faker.string.alpha() },
    ...override,
  }
}
