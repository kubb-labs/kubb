import type { LoginUserQueryResponse, LoginUserQueryParams } from '../../models/ts/userController/LoginUser.ts'

export function loginUser(params?: LoginUserQueryParams, options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<LoginUserQueryResponse> {
  return cy
    .request<LoginUserQueryResponse>({
      method: 'get',
      url: '/user/login',
      qs: params,
      ...options,
    })
    .then((res) => res.body)
}
