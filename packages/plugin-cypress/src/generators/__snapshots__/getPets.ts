export function listPets(): Cypress.Chainable<ListPetsQueryResponse> {
  return cy.request('get', '/pets', undefined).then((res: Cypress.Response<ListPetsQueryResponse>) => res.body)
}
