import type { LogoutUserResponseData } from '../../models/ts/userController/LogoutUser.ts'

export function logoutUser(options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<LogoutUserResponseData> {
  return cy
    .request<LogoutUserResponseData>({
      method: 'get',
      url: '/user/logout',
      ...options,
    })
    .then((res) => res.body)
}
