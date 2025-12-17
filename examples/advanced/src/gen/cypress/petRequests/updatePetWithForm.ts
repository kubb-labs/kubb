import type { UpdatePetWithFormMutationResponse } from '../../models/ts/petController/UpdatePetWithForm.ts'

export function updatePetWithForm(options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<UpdatePetWithFormMutationResponse> {
  return cy
    .request({
      method: 'post',
      url: '/pet/:petId\\:search',
      body: undefined,
      ...options,
    })
    .then((res: Cypress.Response<UpdatePetWithFormMutationResponse>) => res.body)
}
