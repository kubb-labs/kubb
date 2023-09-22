import { faker } from '@faker-js/faker'

import { createUser } from '../createUser'
import { CreateUsersWithListInputerror } from '../../models/ts/userController/CreateUsersWithListInput'
import { CreateUsersWithListInputMutationRequest } from '../../models/ts/userController/CreateUsersWithListInput'
import { CreateUsersWithListInputMutationResponse } from '../../models/ts/userController/CreateUsersWithListInput'

/**
 * @description successful operation
 */

export function createCreateuserswithlistinputerror(): CreateUsersWithListInputerror {
  return undefined
}

export function createCreateuserswithlistinputmutationrequest(): CreateUsersWithListInputMutationRequest {
  return faker.helpers.arrayElements([createUser()]) as any
}

/**
 * @description Successful operation
 */

export function createCreateuserswithlistinputmutationresponse(): CreateUsersWithListInputMutationResponse {
  return createUser()
}
