import type { LogoutUserQueryResponse } from '../../models/LogoutUser.ts'

export function logoutUser(): Cypress.Chainable<LogoutUserQueryResponse> {
  return cy.request('get', 'http://localhost:3000/user/logout', undefined).then((res: Cypress.Response<LogoutUserQueryResponse>) => res.body)
}
