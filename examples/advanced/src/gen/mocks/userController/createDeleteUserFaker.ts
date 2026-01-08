import type { DeleteUserPathParams, DeleteUserResponseData } from '../../models/ts/userController/DeleteUser.ts'
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
export function createDeleteUserStatus400Faker() {
  return undefined
}

/**
 * @description User not found
 */
export function createDeleteUserStatus404Faker() {
  return undefined
}

export function createDeleteUserResponseDataFaker(data?: Partial<DeleteUserResponseData>): DeleteUserResponseData {
  return undefined
}
