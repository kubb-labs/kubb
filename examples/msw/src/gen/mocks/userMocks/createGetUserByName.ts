import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import type { GetUserByNamePathParams, GetUserByName200, GetUserByName400, GetUserByName404, GetUserByNameQueryResponse } from '../../models/GetUserByName'

export function createGetUserByNamePathParams(override: NonNullable<Partial<GetUserByNamePathParams>> = {}): NonNullable<GetUserByNamePathParams> {
  return {
    ...{ 'username': faker.string.alpha() },
    ...override,
  }
}

/**
 * @description successful operation
 */
export function createGetUserByName200(override?: NonNullable<Partial<GetUserByName200>>): NonNullable<GetUserByName200> {
  return createUser(override)
}

/**
 * @description Invalid username supplied
 */
export function createGetUserByName400(override?: NonNullable<Partial<GetUserByName400>>): NonNullable<GetUserByName400> {
  return undefined
}

/**
 * @description User not found
 */
export function createGetUserByName404(override?: NonNullable<Partial<GetUserByName404>>): NonNullable<GetUserByName404> {
  return undefined
}

/**
 * @description successful operation
 */
export function createGetUserByNameQueryResponse(override?: NonNullable<Partial<GetUserByNameQueryResponse>>): NonNullable<GetUserByNameQueryResponse> {
  return createUser(override)
}
