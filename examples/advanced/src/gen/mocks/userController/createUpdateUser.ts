import { faker } from '@faker-js/faker'

import { createUser } from '../createUser'
import { UpdateUserError } from '../../models/ts/userController/UpdateUser'
import { UpdateUserMutationResponse } from '../../models/ts/userController/UpdateUser'
import { UpdateUserPathParams } from '../../models/ts/userController/UpdateUser'
import { UpdateUserMutationRequest } from '../../models/ts/userController/UpdateUser'

/**
 * @description successful operation
 */

export function createUpdateUserError(): UpdateUserError {
  return undefined
}

export function createUpdateUserMutationResponse(): UpdateUserMutationResponse {
  return undefined
}

export function createUpdateUserPathParams(): UpdateUserPathParams {
  return { username: faker.string.alpha() }
}

/**
 * @description Update an existent user in the store
 */

export function createUpdateUserMutationRequest(): UpdateUserMutationRequest {
  return createUser()
}
