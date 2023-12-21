import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import type { GetUserByName400, GetUserByName404, GetUserByNamePathParams, GetUserByNameQueryResponse } from '../../models/GetUserByName'

/**
 * @description Invalid username supplied
 */

export function createGetUserByName400(): NonNullable<GetUserByName400> {
  faker.seed([220])
  return undefined
}
/**
 * @description User not found
 */

export function createGetUserByName404(): NonNullable<GetUserByName404> {
  faker.seed([220])
  return undefined
}

export function createGetUserByNamePathParams(): NonNullable<GetUserByNamePathParams> {
  faker.seed([220])
  return { 'username': faker.string.alpha() }
}
/**
 * @description successful operation
 */

export function createGetUserByNameQueryResponse(): NonNullable<GetUserByNameQueryResponse> {
  faker.seed([220])
  return createUser()
}
