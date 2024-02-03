import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import type { UpdateUserError, UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../models/UpdateUser'

/**
 * @description successful operation
 */

export function createUpdateUserError(override?: Partial<UpdateUserError>): NonNullable<UpdateUserError> {
  return undefined
}

export function createUpdateUserMutationResponse(override?: Partial<UpdateUserMutationResponse>): NonNullable<UpdateUserMutationResponse> {
  return undefined
}

export function createUpdateUserPathParams(override: Partial<UpdateUserPathParams> = {}): NonNullable<UpdateUserPathParams> {
  return {
    ...{ 'username': faker.string.alpha() },
    ...override,
  }
}
/**
 * @description Update an existent user in the store
 */

export function createUpdateUserMutationRequest(override?: Partial<UpdateUserMutationRequest>): NonNullable<UpdateUserMutationRequest> {
  return createUser(override)
}
