import type { GetUserByNamePathParams, GetUserByNameQueryResponse } from '../../models/ts/userController/GetUserByName.ts'
import { createUserFaker } from '../createUserFaker.ts'
import { faker } from '@faker-js/faker'

export function createGetUserByNamePathParamsFaker(data?: Partial<GetUserByNamePathParams>) {
  return {
    ...{ username: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createGetUserByName200Faker() {
  return createUserFaker()
}

/**
 * @description Invalid username supplied
 */
export function createGetUserByName400Faker() {
  return undefined
}

/**
 * @description User not found
 */
export function createGetUserByName404Faker() {
  return undefined
}

export function createGetUserByNameQueryResponseFaker(data?: Partial<GetUserByNameQueryResponse>) {
  return data || faker.helpers.arrayElement<any>([createGetUserByName200Faker()])
}
