import type { LoginUserQueryResponse } from '../../models/LoginUser.ts'

export function loginUser(): Cypress.Chainable<LoginUserQueryResponse> {
  return cy.request('get', 'http://localhost:3000/user/login', undefined).then((res: Cypress.Response<LoginUserQueryResponse>) => res.body)
}
