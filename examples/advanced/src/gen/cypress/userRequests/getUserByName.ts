import type { GetUserByNameQueryResponse } from '../../models/ts/userController/GetUserByName.ts'

export function getUserByName(): Cypress.Chainable<GetUserByNameQueryResponse> {
  return cy.request('get', '/user/:username', undefined).then((res: Cypress.Response<GetUserByNameQueryResponse>) => res.body)
}
