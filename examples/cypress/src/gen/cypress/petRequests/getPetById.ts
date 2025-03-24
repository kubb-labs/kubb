import type { GetPetByIdQueryResponse } from '../../models/GetPetById.ts'

export function getPetById(): Cypress.Chainable<GetPetByIdQueryResponse> {
  return cy.request('get', 'http://localhost:3000/pet/:petId', undefined).then((res: Cypress.Response<GetPetByIdQueryResponse>) => res.body)
}
