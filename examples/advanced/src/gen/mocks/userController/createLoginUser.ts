import type { LoginUserQueryParams } from '../../models/ts/userController/LoginUser.ts'
import { faker } from '@faker-js/faker'

export function createLoginUserQueryParams(data: NonNullable<Partial<LoginUserQueryParams>> = {}) {
  return {
    ...{ username: faker.string.alpha(), password: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createLoginUser200() {
  return faker.string.alpha()
}

/**
 * @description Invalid username/password supplied
 */
export function createLoginUser400() {
  return undefined
}

/**
 * @description successful operation
 */
export function createLoginUserQueryResponse() {
  return faker.string.alpha()
}
