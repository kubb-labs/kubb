export type listPetsQueryMyLimit = number

/**
 * @description A paged array of pets
 */
export type listPetsStatus200 = object

/**
 * @description Unexpected error
 */
export type listPetsStatusDefault = object

export type listPetsRequestConfig = {
  data?: never
  pathParams?: never
  queryParams?: {
    myLimit?: listPetsQueryMyLimit
  }
  headerParams?: never
  url: '/pets'
}

export type listPetsResponses = {
  '200': listPetsStatus200
  default: listPetsStatusDefault
}

/**
 * @description Union of all possible responses
 */
export type listPetsResponse = listPetsStatus200 | listPetsStatusDefault
