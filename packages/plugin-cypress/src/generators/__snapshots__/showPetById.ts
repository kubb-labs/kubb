export function showPetById(data?: ShowPetByIdQueryResponse): Chainable<ShowPetByIdQueryResponse> {
  return cy.request(get)
}
