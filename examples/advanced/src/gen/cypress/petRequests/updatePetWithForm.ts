import type {
  UpdatePetWithFormResponseData,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
} from '../../models/ts/petController/UpdatePetWithForm.ts'

export function updatePetWithForm(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<UpdatePetWithFormResponseData> {
  return cy
    .request<UpdatePetWithFormResponseData>({
      method: 'post',
      url: `/pet/${petId}:search`,
      qs: params,
      ...options,
    })
    .then((res) => res.body)
}
