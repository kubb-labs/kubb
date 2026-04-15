import type { DeletePetPathParams, DeletePetHeaderParams, DeletePetMutationResponse } from '../../models/ts/petController/DeletePet.ts'

export function deletePet(
  petId: DeletePetPathParams['petId'],
  headers?: DeletePetHeaderParams,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<DeletePetMutationResponse> {
  return cy
    .request<DeletePetMutationResponse>({
      method: 'DELETE',
      url: `/pet/${petId}:search`,
      headers: headers ? { api_key: headers.apiKey } : undefined,
      ...options,
    })
    .then((res) => res.body)
}
