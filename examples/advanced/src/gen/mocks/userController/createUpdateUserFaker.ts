import type { UpdateUserPathParams } from '../../models/ts/userController/UpdateUser.js'
import { createUserFaker } from '../createUserFaker.js'
import { faker } from '@faker-js/faker'

export function createUpdateUserPathParamsFaker(data: NonNullable<Partial<UpdateUserPathParams>> = {}) {
  return {
    ...{ username: faker.string.alpha() },
    ...data,
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
