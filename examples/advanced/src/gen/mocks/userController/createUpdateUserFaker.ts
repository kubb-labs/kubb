import { faker } from '@faker-js/faker'
import type { UpdateUserMutationResponse, UpdateUserPathParams } from '../../models/ts/userController/UpdateUser.ts'
import { createUserFaker } from '../createUserFaker.ts'

export function createUpdateUserPathParamsFaker(data?: Partial<UpdateUserPathParams>) {
  return {
    ...{ username: faker.string.alpha() },
    ...(data || {}),
  } as UpdateUserPathParams
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

export function createUpdateUserMutationResponseFaker(_data?: Partial<UpdateUserMutationResponse>) {
  return undefined as UpdateUserMutationResponse
}
