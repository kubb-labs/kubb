import { faker } from '@faker-js/faker'

import { createUser } from '../createUser'
import { CreateUserMutationResponse } from '../../models/ts/userController/CreateUser'
import { CreateUserMutationRequest } from '../../models/ts/userController/CreateUser'
import { CreateUsererror } from '../../models/ts/userController/CreateUser'

export function createCreateusermutationresponse(): CreateUserMutationResponse {
  return undefined
}

/**
 * @description Created user object
 */

export function createCreateusermutationrequest(): CreateUserMutationRequest {
  return createUser()
}

/**
 * @description successful operation
 */

export function createCreateusererror(): CreateUsererror {
  return createUser()
}
