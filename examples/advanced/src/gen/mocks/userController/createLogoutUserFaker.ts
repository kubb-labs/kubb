import type { LogoutUserQueryResponse } from '../../models/ts/userController/LogoutUser.ts'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createLogoutUserErrorFaker() {
  return undefined
}

export function createLogoutUserQueryResponseFaker(data?: Partial<LogoutUserQueryResponse>): LogoutUserQueryResponse {
  return data || faker.helpers.arrayElement<any>([])
}
