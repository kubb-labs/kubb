/**
 * @description Null response
 */
export type CreatePetsStatus201 = object

/**
 * @description Unexpected error
 */
export type CreatePetsStatusDefault = object

/**
 * @description Pet to add
 */
export type CreatePetsData = object

export type CreatePetsRequestConfig = {
  data?: createPetsData
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/pets'
}

export type CreatePetsResponses = {
  '201': createPetsStatus201
  default: createPetsStatusDefault
}

/**
 * @description Union of all possible responses
 */
export type CreatePetsResponse = createPetsStatus201 | createPetsStatusDefault
