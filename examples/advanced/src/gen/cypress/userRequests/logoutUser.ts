import type { LogoutUserQueryResponse } from '../../models/ts/userController/LogoutUser.ts'

export function logoutUser(options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<LogoutUserQueryResponse> {
  return cy
    .request({
      method: 'get',
      url: '/user/logout',
      body: undefined,
      ...options,
    })
    .then((res: Cypress.Response<LogoutUserQueryResponse>) => res.body)
}
