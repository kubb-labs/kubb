import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import { GetUserByName400, GetUserByName404, GetUserByNamePathParams, GetUserByNameQueryResponse } from '../../models/ts/userController/GetUserByName'

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
  return { 'username': faker.string.alpha() }
}
/**
 * @description successful operation
 */

export function createGetUserByNameQueryResponse(): NonNullable<GetUserByNameQueryResponse> {
  return createUser()
}
