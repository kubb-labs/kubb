import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../models/ts/userController/UpdateUser.ts'
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
export function createUpdateUserMutationRequestFaker(data?: Partial<UpdateUserMutationRequest>): UpdateUserMutationRequest {
  return createUserFaker(data)
}

export function createUpdateUserMutationResponseFaker(data?: Partial<UpdateUserMutationResponse>): UpdateUserMutationResponse {
  return undefined
}
