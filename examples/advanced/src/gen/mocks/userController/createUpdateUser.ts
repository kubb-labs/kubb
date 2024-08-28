import type { UpdateUserPathParams, UpdateUserError, UpdateUserMutationRequest, UpdateUserMutationResponse } from '../../models/ts/userController/UpdateUser'
import { createUser } from '../createUser.ts'
import { faker } from '@faker-js/faker'

export function createUpdateUserPathParams(): NonNullable<UpdateUserPathParams> {
  return { username: faker.string.alpha() }
}

/**
 * @description successful operation
 */
export function createUpdateUserError(): NonNullable<UpdateUserError> {
  return undefined
}

/**
 * @description Update an existent user in the store
 */
export function createUpdateUserMutationRequest(): NonNullable<UpdateUserMutationRequest> {
  return createUser()
}

export function createUpdateUserMutationResponse(): NonNullable<UpdateUserMutationResponse> {
  return undefined
}
