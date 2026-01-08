import type { LoginUserResponseData, LoginUserQueryParams } from '../../models/ts/userController/LoginUser.ts'

export function loginUser(params?: LoginUserQueryParams, options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<LoginUserResponseData> {
  return cy
    .request<LoginUserResponseData>({
      method: 'get',
      url: '/user/login',
      qs: params,
      ...options,
    })
    .then((res) => res.body)
}
