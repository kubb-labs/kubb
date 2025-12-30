import { faker } from '@faker-js/faker'
import type { UpdateUserMutationResponse, UpdateUserPathParams } from '../../models/ts/userController/updateUser.ts'
import { createUserFaker } from '../userFaker.ts'

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

export function createUpdateUserMutationResponseFaker(_data?: Partial<UpdateUserMutationResponse>): UpdateUserMutationResponse {
  return undefined
}
