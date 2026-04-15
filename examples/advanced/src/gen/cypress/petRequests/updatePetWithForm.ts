import type {
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithFormMutationResponse,
} from '../../models/ts/petController/UpdatePetWithForm.ts'

export function updatePetWithForm(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<UpdatePetWithFormMutationResponse> {
  return cy
    .request<UpdatePetWithFormMutationResponse>({
      method: 'POST',
      url: `/pet/${petId}:search`,
      qs: params,
      ...options,
    })
    .then((res) => res.body)
}
