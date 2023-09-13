import { faker } from '@faker-js/faker'

import { createUser } from '../createUser'
import { CreateUserMutationResponse } from '../../models/ts/userController/CreateUser'
import { CreateUserError } from '../../models/ts/userController/CreateUser'
import { CreateUserMutationRequest } from '../../models/ts/userController/CreateUser'

export function createCreateUserMutationResponse(): CreateUserMutationResponse {
  return undefined
}

/**
 * @description successful operation
 */
export function createCreateUserError(): CreateUserError {
  return createUser()
}

/**
 * @description Created user object
 */
export function createCreateUserMutationRequest(): CreateUserMutationRequest {
  return createUser()
}
