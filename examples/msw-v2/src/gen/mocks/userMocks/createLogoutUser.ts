import { faker } from '@faker-js/faker'
import type { LogoutUserQueryResponse } from '../../models/LogoutUser'

export function createLogoutUserQueryResponse(override?: NonNullable<Partial<LogoutUserQueryResponse>>): NonNullable<LogoutUserQueryResponse> {
  faker.seed([220])
  return undefined
}
