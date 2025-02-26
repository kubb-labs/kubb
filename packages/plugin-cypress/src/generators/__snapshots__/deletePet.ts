export function deletePetsPetid(data?: DeletePetsPetidMutationResponse): Chainable<DeletePetsPetidMutationResponse> {
  return cy.request('delete', '/pets/:petId', data || undefined)
}
