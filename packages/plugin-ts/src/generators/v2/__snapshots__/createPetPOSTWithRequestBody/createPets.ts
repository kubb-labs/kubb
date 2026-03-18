/**
 * @description Null response
 */
export type createPets201 = object

/**
 * @description Unexpected error
 */
export type createPetsDefault = object

/**
 * @description Pet to add
 */
export type createPetsMutationRequest = object

export type createPetsData = {
  data?: createPetsMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/pets'
}

export type createPetsResponses = {
  '201': createPets201
  default: createPetsDefault
}

export type createPetsResponse = createPets201 | createPetsDefault
