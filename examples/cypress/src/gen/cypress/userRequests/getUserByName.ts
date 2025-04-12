import type { GetUserByNameQueryResponse } from '../../models/GetUserByName.ts'

export function getUserByName(): Cypress.Chainable<GetUserByNameQueryResponse> {
  return cy.request('get', 'http://localhost:3000/user/:username', undefined).then((res: Cypress.Response<GetUserByNameQueryResponse>) => res.body)
}
