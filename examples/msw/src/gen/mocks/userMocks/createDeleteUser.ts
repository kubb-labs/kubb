import { faker } from '@faker-js/faker'
import type { DeleteUser400, DeleteUser404, DeleteUserMutationResponse, DeleteUserPathParams } from '../../models/DeleteUser'

/**
 * @description Invalid username supplied
 */

export function createDeleteUser400(override?: Partial<DeleteUser400>): NonNullable<DeleteUser400> {
  return undefined
}
/**
 * @description User not found
 */

export function createDeleteUser404(override?: Partial<DeleteUser404>): NonNullable<DeleteUser404> {
  return undefined
}

export function createDeleteUserMutationResponse(override?: Partial<DeleteUserMutationResponse>): NonNullable<DeleteUserMutationResponse> {
  return undefined
}

export function createDeleteUserPathParams(override: Partial<DeleteUserPathParams> = {}): NonNullable<DeleteUserPathParams> {
  return {
    ...{ 'username': faker.string.alpha() },
    ...override,
  }
}
