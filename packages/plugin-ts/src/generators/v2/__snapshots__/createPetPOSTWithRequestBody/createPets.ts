/**
 * @description Null response
 */
export type createPetsStatus201 = object

/**
 * @description Unexpected error
 */
export type createPetsStatusDefault = object

/**
 * @description Pet to add
 */
export type createPetsMutationRequest = object

export type createPetsRequestConfig = {
  data?: createPetsMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/pets'
}

export type createPetsResponses = {
  '201': createPetsStatus201
  default: createPetsStatusDefault
}

/**
 * @description Union of all possible responses
 */
export type createPetsResponse = createPetsStatus201 | createPetsStatusDefault
