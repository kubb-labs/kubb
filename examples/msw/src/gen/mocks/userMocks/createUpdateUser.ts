import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import type { UpdateUserPathParams, UpdateUserError, UpdateUserMutationRequest, UpdateUserMutationResponse } from '../../models/UpdateUser'

export function createUpdateUserPathParams(override: NonNullable<Partial<UpdateUserPathParams>> = {}): NonNullable<UpdateUserPathParams> {
  return {
    ...{ username: faker.string.alpha() },
    ...override,
  }
}

/**
 * @description successful operation
 */
export function createUpdateUserError(override?: NonNullable<Partial<UpdateUserError>>): NonNullable<UpdateUserError> {
  return undefined
}

/**
 * @description Update an existent user in the store
 */
export function createUpdateUserMutationRequest(override?: NonNullable<Partial<UpdateUserMutationRequest>>): NonNullable<UpdateUserMutationRequest> {
  return createUser(override)
}

export function createUpdateUserMutationResponse(override?: NonNullable<Partial<UpdateUserMutationResponse>>): NonNullable<UpdateUserMutationResponse> {
  return undefined
}
