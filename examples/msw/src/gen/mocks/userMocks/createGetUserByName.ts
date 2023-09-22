import { faker } from '@faker-js/faker'

import { createUser } from '../createUser'
import { GetUserByName400 } from '../../models/GetUserByName'
import { GetUserByName404 } from '../../models/GetUserByName'
import { GetUserByNamePathParams } from '../../models/GetUserByName'
import { GetUserByNameQueryResponse } from '../../models/GetUserByName'

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
