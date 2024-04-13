import { faker } from '@faker-js/faker'
import type { UpdateUserError, UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../models/ts/userController/UpdateUser'
import { createUser } from '../createUser'

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
