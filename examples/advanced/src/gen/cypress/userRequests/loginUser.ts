import type { LoginUserQueryResponse } from '../../models/ts/userController/LoginUser.ts'

export function loginUser(options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<LoginUserQueryResponse> {
  return cy
    .request({
      method: 'get',
      url: '/user/login',
      body: undefined,
      ...options,
    })
    .then((res: Cypress.Response<LoginUserQueryResponse>) => res.body)
}
