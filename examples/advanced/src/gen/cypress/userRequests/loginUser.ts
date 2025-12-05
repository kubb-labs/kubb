import type { LoginUserQueryResponse } from '../../models/ts/userController/LoginUser.ts'

export function loginUser(): Cypress.Chainable<LoginUserQueryResponse> {
  return cy.request('get', '/user/login', undefined).then((res: Cypress.Response<LoginUserQueryResponse>) => res.body)
}
