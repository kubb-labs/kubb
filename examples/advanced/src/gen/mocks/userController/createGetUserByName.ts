import { faker } from '@faker-js/faker'

import { GetUserByName400 } from '../../models/ts/userController/GetUserByName'
import { GetUserByName404 } from '../../models/ts/userController/GetUserByName'
import { GetUserByNamePathParams } from '../../models/ts/userController/GetUserByName'
import { GetUserByNameQueryResponse } from '../../models/ts/userController/GetUserByName'
import { createUser } from '../createUser'

/**
 * @description Invalid username supplied
 */

export function createGetUserByName400(): NonNullable<GetUserByName400> {
  return undefined
}

/**
 * @description User not found
 */

export function createGetUserByName404(): NonNullable<GetUserByName404> {
  return undefined
}

export function createGetUserByNamePathParams(): NonNullable<GetUserByNamePathParams> {
  return { username: faker.string.alpha() }
}

/**
 * @description successful operation
 */

export function createGetUserByNameQueryResponse(): NonNullable<GetUserByNameQueryResponse> {
  return createUser()
}
