import { faker } from '@faker-js/faker'
import type { LogoutUserError, LogoutUserQueryResponse } from '../../models/LogoutUser'

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
