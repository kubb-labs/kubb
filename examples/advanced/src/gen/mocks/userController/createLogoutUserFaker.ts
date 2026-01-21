import type { LogoutUserQueryResponse } from '../../models/ts/userController/LogoutUser.ts'

/**
 * @description successful operation
 */
export function createLogoutUserErrorFaker() {
  return undefined
}

export function createLogoutUserQueryResponseFaker(_data?: Partial<LogoutUserQueryResponse>) {
  return undefined as LogoutUserQueryResponse
}
