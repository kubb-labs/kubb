import { faker } from '@faker-js/faker'
import { LogoutUserError, LogoutUserQueryResponse } from '../../models/LogoutUser'

/**
 * @description successful operation
 */
export function createLogoutUserError(override?: NonNullable<Partial<LogoutUserError>>): NonNullable<LogoutUserError> {
  faker.seed([220])
  return undefined
}

export function createLogoutUserQueryResponse(override?: NonNullable<Partial<LogoutUserQueryResponse>>): NonNullable<LogoutUserQueryResponse> {
  faker.seed([220])
  return undefined
}
