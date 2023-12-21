import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import type { UpdateUserError, UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../models/UpdateUser'

/**
 * @description successful operation
 */

export function createUpdateUserError(): NonNullable<UpdateUserError> {
  faker.seed([220])
  return undefined
}

export function createUpdateUserMutationResponse(): NonNullable<UpdateUserMutationResponse> {
  faker.seed([220])
  return undefined
}

export function createUpdateUserPathParams(): NonNullable<UpdateUserPathParams> {
  faker.seed([220])
  return { 'username': faker.string.alpha() }
}
/**
 * @description Update an existent user in the store
 */

export function createUpdateUserMutationRequest(): NonNullable<UpdateUserMutationRequest> {
  faker.seed([220])
  return createUser()
}
