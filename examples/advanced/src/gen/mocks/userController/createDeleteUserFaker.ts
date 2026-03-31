import { faker } from '@faker-js/faker'
import type { DeleteUserMutationResponse, DeleteUserPathParams } from '../../models/ts/userController/DeleteUser.ts'

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

export function createDeleteUserMutationResponseFaker(_data?: Partial<DeleteUserMutationResponse>): DeleteUserMutationResponse {
  return undefined
}
