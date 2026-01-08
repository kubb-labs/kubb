import type { LogoutUserQueryResponse } from '../../models/ts/userController/LogoutUser.ts'

export function logoutUser(options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<LogoutUserQueryResponse> {
  return cy
    .request<LogoutUserQueryResponse>({
      method: 'get',
      url: '/user/logout',
      ...options,
    })
    .then((res) => res.body)
}
