import { faker } from '@faker-js/faker'

/**
 * @description Invalid username/password supplied
 */

export function createLoginUser400() {
  return undefined
}

export function createLoginUserQueryParams() {
  return { username: faker.string.alpha({}), password: faker.string.alpha({}) }
}

/**
 * @description successful operation
 */

export function createLoginUserQueryResponse() {
  return faker.string.alpha({})
}
