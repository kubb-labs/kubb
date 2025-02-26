export function listPets(data?: ListPetsQueryResponse): Chainable<ListPetsQueryResponse> {
  return cy.request('get', '/pets', data || undefined)
}
