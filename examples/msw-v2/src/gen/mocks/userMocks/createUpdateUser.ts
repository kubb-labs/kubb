import { faker } from '@faker-js/faker'

import { createUser } from '../createUser'
import { UpdateUserError } from '../../models/UpdateUser'
import { UpdateUserMutationResponse } from '../../models/UpdateUser'
import { UpdateUserPathParams } from '../../models/UpdateUser'
import { UpdateUserMutationRequest } from '../../models/UpdateUser'

/**
 * @description successful operation
 */

export function createUpdateUserError(): NonNullable<UpdateUserError> {
  return undefined
}

export function createUpdateUserMutationResponse(): NonNullable<UpdateUserMutationResponse> {
  return undefined
}

export function createUpdateUserPathParams(): NonNullable<UpdateUserPathParams> {
  return { 'username': faker.string.alpha() }
}

/**
 * @description Update an existent user in the store
 */

export function createUpdateUserMutationRequest(): NonNullable<UpdateUserMutationRequest> {
  return createUser()
}
