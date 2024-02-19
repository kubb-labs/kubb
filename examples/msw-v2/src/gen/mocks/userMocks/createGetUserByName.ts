import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import type { GetUserByName400, GetUserByName404, GetUserByNamePathParams, GetUserByNameQueryResponse } from '../../models/GetUserByName'

/**
 * @description Invalid username supplied
 */

export function createGetUserByName400(override?: NonNullable<Partial<GetUserByName400>>): NonNullable<GetUserByName400> {
  faker.seed([220])
  return undefined
}
/**
 * @description User not found
 */

export function createGetUserByName404(override?: NonNullable<Partial<GetUserByName404>>): NonNullable<GetUserByName404> {
  faker.seed([220])
  return undefined
}

export function createGetUserByNamePathParams(override: NonNullable<Partial<GetUserByNamePathParams>> = {}): NonNullable<GetUserByNamePathParams> {
  faker.seed([220])
  return {
    ...{ 'username': faker.string.alpha() },
    ...override,
  }
}
/**
 * @description successful operation
 */

export function createGetUserByNameQueryResponse(override?: NonNullable<Partial<GetUserByNameQueryResponse>>): NonNullable<GetUserByNameQueryResponse> {
  faker.seed([220])
  return createUser(override)
}
