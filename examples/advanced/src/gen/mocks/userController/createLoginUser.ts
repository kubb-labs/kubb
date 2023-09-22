import { faker } from '@faker-js/faker'

import { LoginUser400 } from '../../models/ts/userController/LoginUser'
import { LoginUserQueryResponse } from '../../models/ts/userController/LoginUser'
import { LoginuserQueryparams } from '../../models/ts/userController/LoginUser'

/**
 * @description Invalid username/password supplied
 */

export function createLoginuser400(): LoginUser400 {
  return undefined
}

/**
 * @description successful operation
 */

export function createLoginuserqueryresponse(): LoginUserQueryResponse {
  return faker.string.alpha()
}

export function createLoginuserqueryparams(): LoginuserQueryparams {
  return { username: faker.string.alpha(), password: faker.internet.password() }
}
