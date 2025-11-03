import type { LogoutUserQueryResponse } from "../../models/ts/userController/LogoutUser.ts";

export function logoutUser(): Cypress.Chainable<LogoutUserQueryResponse> {
  return cy.request('get', '/user/logout', undefined).then((res: Cypress.Response<LogoutUserQueryResponse>) => res.body)
}