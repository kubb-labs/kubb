import type { CreateUserResponseData } from '../../models/ts/userController/CreateUser.ts'
import { createUserFaker } from '../createUserFaker.ts'

/**
 * @description successful operation
 */
export function createCreateUserStatusErrorFaker() {
  return createUserFaker()
}

/**
 * @description Created user object
 */
export function createCreateUserRequestDataFaker() {
  return createUserFaker()
}

export function createCreateUserResponseDataFaker(data?: Partial<CreateUserResponseData>): CreateUserResponseData {
  return undefined
}
