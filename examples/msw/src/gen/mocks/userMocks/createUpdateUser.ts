import { faker } from '@faker-js/faker'
import { UpdateUserError, UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../models/UpdateUser'
import { createUser } from '../createUser'

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

export function createUpdateUserPathParams(override: NonNullable<Partial<UpdateUserPathParams>> = {}): NonNullable<UpdateUserPathParams> {
  return {
    ...{ 'username': faker.string.alpha() },
    ...override,
  }
}
