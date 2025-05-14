import type { GetPetByIdQueryResponse } from '../../models/ts/petController/GetPetById.ts'

export function getPetById(): Cypress.Chainable<GetPetByIdQueryResponse> {
  return cy.request('get', '/pet/:petId', undefined).then((res: Cypress.Response<GetPetByIdQueryResponse>) => res.body)
}
