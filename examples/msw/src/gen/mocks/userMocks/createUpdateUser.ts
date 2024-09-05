import type { UpdateUserPathParams, UpdateUserError, UpdateUserMutationRequest, UpdateUserMutationResponse } from '../../models/UpdateUser'
import { createUser } from '../createUser.ts'
import { faker } from '@faker-js/faker'

export function createUpdateUserPathParams(data: NonNullable<Partial<UpdateUserPathParams>> = {}): NonNullable<UpdateUserPathParams> {
  faker.seed([220])
  return {
    ...{ username: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createUpdateUserError(): NonNullable<UpdateUserError> {
  faker.seed([220])
  return undefined
}

/**
 * @description Update an existent user in the store
 */
export function createUpdateUserMutationRequest(): NonNullable<UpdateUserMutationRequest> {
  faker.seed([220])
  return createUser()
}

export function createUpdateUserMutationResponse(): NonNullable<UpdateUserMutationResponse> {
  faker.seed([220])
  return undefined
}
