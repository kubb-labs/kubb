export function showPetById(): Cypress.Chainable<ShowPetByIdQueryResponse> {
  return cy.request('get', '/pets/:petId', undefined).then((res: Cypress.Response<ShowPetByIdQueryResponse>) => res.body)
}
