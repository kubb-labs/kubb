import { faker } from '@faker-js/faker'

import { createUser } from '../createUser'
import { UpdateUserMutationResponse } from '../../models/ts/userController/UpdateUser'
import { UpdateUserPathParams } from '../../models/ts/userController/UpdateUser'
import { UpdateUsererror } from '../../models/ts/userController/UpdateUser'
import { UpdateUserMutationRequest } from '../../models/ts/userController/UpdateUser'

export function createUpdateusermutationresponse(): UpdateUserMutationResponse {
  return undefined
}

export function createUpdateuserpathparams(): UpdateUserPathParams {
  return { username: faker.string.alpha() }
}

/**
 * @description successful operation
 */

export function createUpdateusererror(): UpdateUsererror {
  return undefined
}

/**
 * @description Update an existent user in the store
 */

export function createUpdateusermutationrequest(): UpdateUserMutationRequest {
  return createUser()
}
