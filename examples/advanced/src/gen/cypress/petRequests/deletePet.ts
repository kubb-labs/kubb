import type { DeletePetResponseData, DeletePetPathParams, DeletePetHeaderParams } from '../../models/ts/petController/DeletePet.ts'

export function deletePet(
  petId: DeletePetPathParams['petId'],
  headers?: DeletePetHeaderParams,
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<DeletePetResponseData> {
  return cy
    .request<DeletePetResponseData>({
      method: 'delete',
      url: `/pet/${petId}:search`,
      headers,
      ...options,
    })
    .then((res) => res.body)
}
