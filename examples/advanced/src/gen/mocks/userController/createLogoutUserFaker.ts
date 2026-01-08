import type { LogoutUserResponseData } from '../../models/ts/userController/LogoutUser.ts'

/**
 * @description successful operation
 */
export function createLogoutUserStatusErrorFaker() {
  return undefined
}

export function createLogoutUserResponseDataFaker(data?: Partial<LogoutUserResponseData>): LogoutUserResponseData {
  return undefined
}
