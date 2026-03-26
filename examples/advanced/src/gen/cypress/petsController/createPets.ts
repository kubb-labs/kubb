import type {
  CreatePetsHeaderParams,
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
} from '../../models/ts/petsController/CreatePets.ts'

export function createPets(
  { uuid }: CreatePetsPathParams,
  data: CreatePetsMutationRequest,
  headers: CreatePetsHeaderParams,
  params?: CreatePetsQueryParams,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<CreatePetsMutationResponse> {
  return cy
    .request<CreatePetsMutationResponse>({
      method: 'post',
      url: `/pets/${uuid}`,
      qs: params,
      headers,
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
