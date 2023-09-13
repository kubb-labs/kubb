import { faker } from '@faker-js/faker'

import { DeleteUser400 } from '../../models/ts/userController/DeleteUser'
import { DeleteUser404 } from '../../models/ts/userController/DeleteUser'
import { DeleteUserMutationResponse } from '../../models/ts/userController/DeleteUser'
import { DeleteUserPathParams } from '../../models/ts/userController/DeleteUser'
/**
 * @description Invalid username supplied
 */
export function createDeleteUser400(): DeleteUser400 {
  return undefined
}

/**
 * @description User not found
 */
export function createDeleteUser404(): DeleteUser404 {
  return undefined
}

export function createDeleteUserMutationResponse(): DeleteUserMutationResponse {
  return undefined
}

export function createDeleteUserPathParams(): DeleteUserPathParams {
  return { username: faker.string.alpha() }
}
