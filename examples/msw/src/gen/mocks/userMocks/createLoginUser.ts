import { faker } from '@faker-js/faker'

import { LoginUser400 } from '../../models/LoginUser'
import { LoginUserQueryParams } from '../../models/LoginUser'
import { LoginUserQueryResponse } from '../../models/LoginUser'

/**
 * @description Invalid username/password supplied
 */

export function createLoginUser400(): LoginUser400 {
  return undefined
}

export function createLoginUserQueryParams(): LoginUserQueryParams {
  return { username: faker.string.alpha(), password: faker.internet.password() }
}

/**
 * @description successful operation
 */

export function createLoginUserQueryResponse(): LoginUserQueryResponse {
  return faker.string.alpha()
}
