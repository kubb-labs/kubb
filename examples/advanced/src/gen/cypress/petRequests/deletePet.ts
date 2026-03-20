import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams } from '../../models/ts/petController/DeletePet.ts'

export function deletePet(
  petId: DeletePetPathParams['petId'],
  headers?: DeletePetHeaderParams,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<DeletePetMutationResponse> {
  return cy
    .request<DeletePetMutationResponse>({
      method: 'delete',
      url: `/pet/${petId}:search`,
      headers,
      ...options,
    })
    .then((res) => res.body)
}
