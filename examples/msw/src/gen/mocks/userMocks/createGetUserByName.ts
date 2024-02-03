import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import type { GetUserByName400, GetUserByName404, GetUserByNamePathParams, GetUserByNameQueryResponse } from '../../models/GetUserByName'

/**
 * @description Invalid username supplied
 */

export function createGetUserByName400(override?: Partial<GetUserByName400>): NonNullable<GetUserByName400> {
  return undefined
}
/**
 * @description User not found
 */

export function createGetUserByName404(override?: Partial<GetUserByName404>): NonNullable<GetUserByName404> {
  return undefined
}

export function createGetUserByNamePathParams(override: Partial<GetUserByNamePathParams> = {}): NonNullable<GetUserByNamePathParams> {
  return {
    ...{ 'username': faker.string.alpha() },
    ...override,
  }
}
/**
 * @description successful operation
 */

export function createGetUserByNameQueryResponse(override?: Partial<GetUserByNameQueryResponse>): NonNullable<GetUserByNameQueryResponse> {
  return createUser(override)
}
