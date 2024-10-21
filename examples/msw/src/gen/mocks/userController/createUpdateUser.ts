import type { UpdateUserPathParams } from '../../models/UpdateUser.ts'
import { createUser } from '../createUser.ts'
import { faker } from '@faker-js/faker'

export function createUpdateUserPathParams(data?: Partial<UpdateUserPathParams>) {
  faker.seed([220])
  return {
    ...{ username: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createUpdateUserError() {
  faker.seed([220])
  return undefined
}

/**
 * @description Update an existent user in the store
 */
export function createUpdateUserMutationRequest() {
  faker.seed([220])
  return createUser()
}

export function createUpdateUserMutationResponse() {
  faker.seed([220])
  return undefined
}
