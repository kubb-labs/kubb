import type { OptionsFindPetsByStatusMutationResponse } from '../../models/OptionsFindPetsByStatus.ts'

export function optionsFindPetsByStatus(): Cypress.Chainable<OptionsFindPetsByStatusMutationResponse> {
  return cy
    .request('options', 'http://localhost:3000/pet/findByStatus', undefined)
    .then((res: Cypress.Response<OptionsFindPetsByStatusMutationResponse>) => res.body)
}
