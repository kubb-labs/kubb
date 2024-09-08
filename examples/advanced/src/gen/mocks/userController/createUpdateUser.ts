import type { UpdateUserPathParams } from '../../models/ts/userController/UpdateUser.ts'
import { createUser } from '../createUser.ts'
import { faker } from '@faker-js/faker'

export function createUpdateUserPathParams(data: NonNullable<Partial<UpdateUserPathParams>> = {}) {
  return {
    ...{ username: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createUpdateUserError() {
  return undefined
}

/**
 * @description Update an existent user in the store
 */
export function createUpdateUserMutationRequest() {
  return createUser()
}

export function createUpdateUserMutationResponse() {
  return undefined
}
