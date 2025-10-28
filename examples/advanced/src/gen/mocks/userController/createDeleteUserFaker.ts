import type { DeleteUserPathParams, DeleteUserMutationResponse } from '../../models/ts/userController/DeleteUser.ts'
import { faker } from '@faker-js/faker'

export function createDeleteUserPathParamsFaker(data?: Partial<DeleteUserPathParams>): DeleteUserPathParams {
  return {
    ...{ username: faker.string.alpha() },
    ...(data || {}),
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

export function createDeleteUserMutationResponseFaker(data?: Partial<DeleteUserMutationResponse>): DeleteUserMutationResponse {
  return undefined
}
