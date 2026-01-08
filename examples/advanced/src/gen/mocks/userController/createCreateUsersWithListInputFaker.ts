import { faker } from '@faker-js/faker'
import type { CreateUsersWithListInputRequestData, CreateUsersWithListInputResponseData } from '../../models/ts/userController/CreateUsersWithListInput.ts'
import { createUserFaker } from '../createUserFaker.ts'

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInputStatus200Faker() {
  return createUserFaker()
}

/**
 * @description successful operation
 */
export function createCreateUsersWithListInputStatusErrorFaker() {
  return undefined
}

export function createCreateUsersWithListInputRequestDataFaker(data?: CreateUsersWithListInputRequestData): CreateUsersWithListInputRequestData {
  return [...faker.helpers.multiple(() => createUserFaker()), ...(data || [])]
}

export function createCreateUsersWithListInputResponseDataFaker(data?: Partial<CreateUsersWithListInputResponseData>): CreateUsersWithListInputResponseData {
  return data || faker.helpers.arrayElement<any>([createCreateUsersWithListInputStatus200Faker()])
}
