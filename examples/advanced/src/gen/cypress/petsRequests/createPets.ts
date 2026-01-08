import type {
  CreatePetsRequestData,
  CreatePetsResponseData,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
} from '../../models/ts/petsController/CreatePets.ts'

export function createPets(
  uuid: CreatePetsPathParams['uuid'],
  data: CreatePetsRequestData,
  headers: CreatePetsHeaderParams,
  params?: CreatePetsQueryParams,
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<CreatePetsResponseData> {
  return cy
    .request<CreatePetsResponseData>({
      method: 'post',
      url: `/pets/${uuid}`,
      qs: params,
      headers,
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
