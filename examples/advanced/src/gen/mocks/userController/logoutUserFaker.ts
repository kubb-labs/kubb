import type { LogoutUserQueryResponse } from '../../models/ts/userController/logoutUser.ts'

/**
 * @description successful operation
 */
export function createLogoutUserErrorFaker() {
  return undefined
}

export function createLogoutUserQueryResponseFaker(_data?: Partial<LogoutUserQueryResponse>): LogoutUserQueryResponse {
  return undefined
}
