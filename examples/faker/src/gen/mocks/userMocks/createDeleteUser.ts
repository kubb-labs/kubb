import { faker } from '@faker-js/faker'

import type { DeleteUser400, DeleteUser404, DeleteUserMutationResponse, DeleteUserPathParams } from '../../models/DeleteUser'

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
