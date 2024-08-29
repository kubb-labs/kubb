import type { LogoutUserError, LogoutUserQueryResponse } from '../../models/LogoutUser'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createLogoutUserError(): NonNullable<LogoutUserError> {
  faker.seed([220])
  return undefined
}

export function createLogoutUserQueryResponse(): NonNullable<LogoutUserQueryResponse> {
  faker.seed([220])
  return undefined
}
