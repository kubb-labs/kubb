import { faker } from '@faker-js/faker'

import { createUser } from '../createUser'
import { GetUserByName400 } from '../../models/ts/userController/GetUserByName'
import { GetUserByName404 } from '../../models/ts/userController/GetUserByName'
import { GetUserByNamePathParams } from '../../models/ts/userController/GetUserByName'
import { GetUserByNameQueryResponse } from '../../models/ts/userController/GetUserByName'

/**
 * @description Invalid username supplied
 */
export function createGetUserByName400(): GetUserByName400 {
  return undefined
}

/**
 * @description User not found
 */
export function createGetUserByName404(): GetUserByName404 {
  return undefined
}

export function createGetUserByNamePathParams(): GetUserByNamePathParams {
  return { username: faker.string.alpha() }
}

/**
 * @description successful operation
 */
export function createGetUserByNameQueryResponse(): GetUserByNameQueryResponse {
  return createUser()
}
