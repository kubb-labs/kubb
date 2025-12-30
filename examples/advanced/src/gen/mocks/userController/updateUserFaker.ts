import type { UpdateUserPathParams, UpdateUserMutationResponse } from '../../models/ts/userController/updateUser.ts'
import { createUserFaker } from '../userFaker.ts'
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

export function createUpdateUserMutationResponseFaker(data?: Partial<UpdateUserMutationResponse>): UpdateUserMutationResponse {
  return undefined
}
