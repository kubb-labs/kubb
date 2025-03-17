import type { UpdateUserPathParams } from '../../models/ts/userController/UpdateUser.ts'
import { createUserFaker } from '../createUserFaker.ts'
import { faker } from '@faker-js/faker'

export function createUpdateUserPathParamsFaker(data?: Partial<UpdateUserPathParams>): UpdateUserPathParams {
  return {
    ...{ username: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createUpdateUserErrorFaker() {
  return undefined
}

/**
 * @description Update an existent user in the store
 */
export function createUpdateUserMutationRequestFaker() {
  return createUserFaker()
}

export function createUpdateUserMutationResponseFaker() {
  return undefined
}
