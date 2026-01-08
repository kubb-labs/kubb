import type { GetUserByNamePathParams, GetUserByNameResponseData } from '../../models/ts/userController/GetUserByName.ts'
import { createUserFaker } from '../createUserFaker.ts'
import { faker } from '@faker-js/faker'

export function createGetUserByNamePathParamsFaker(data?: Partial<GetUserByNamePathParams>): GetUserByNamePathParams {
  return {
    ...{ username: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createGetUserByNameStatus200Faker() {
  return createUserFaker()
}

/**
 * @description Invalid username supplied
 */
export function createGetUserByNameStatus400Faker() {
  return undefined
}

/**
 * @description User not found
 */
export function createGetUserByNameStatus404Faker() {
  return undefined
}

export function createGetUserByNameResponseDataFaker(data?: Partial<GetUserByNameResponseData>): GetUserByNameResponseData {
  return data || faker.helpers.arrayElement<any>([createGetUserByNameStatus200Faker()])
}
