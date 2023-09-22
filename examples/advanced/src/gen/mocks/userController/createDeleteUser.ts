import { faker } from '@faker-js/faker'

import { DeleteUser400 } from '../../models/ts/userController/DeleteUser'
import { DeleteUser404 } from '../../models/ts/userController/DeleteUser'
import { DeleteUserMutationResponse } from '../../models/ts/userController/DeleteUser'
import { DeleteUserPathParams } from '../../models/ts/userController/DeleteUser'

/**
 * @description Invalid username supplied
 */

export function createDeleteuser400(): DeleteUser400 {
  return undefined
}

/**
 * @description User not found
 */

export function createDeleteuser404(): DeleteUser404 {
  return undefined
}

export function createDeleteusermutationresponse(): DeleteUserMutationResponse {
  return undefined
}

export function createDeleteuserpathparams(): DeleteUserPathParams {
  return { username: faker.string.alpha() }
}
