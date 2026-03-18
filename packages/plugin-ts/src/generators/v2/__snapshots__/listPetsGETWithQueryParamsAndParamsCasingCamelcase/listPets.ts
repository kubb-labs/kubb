export type listPetsMyLimit = number

/**
 * @description A paged array of pets
 */
export type listPets200 = object

/**
 * @description Unexpected error
 */
export type listPetsDefault = object

export type listPetsData = {
  data?: never
  pathParams?: never
  queryParams?: {
    myLimit?: listPetsMyLimit
  }
  headerParams?: never
  url: '/pets'
}

export type listPetsResponses = {
  '200': listPets200
  default: listPetsDefault
}

export type listPetsResponse = listPets200 | listPetsDefault
