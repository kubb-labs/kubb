export type ListPetsQueryParams = {
  /**
   * @description How many items to return at one time (max 100)
   * @type string | undefined
   */
  limit?: string
}

/**
 * @description A paged array of pets
 */
export type ListPets200 = pets

/**
 * @description unexpected error
 */
export type ListPetsError = error

/**
 * @description A paged array of pets
 */
export type ListPetsQueryResponse = pets

export type listPetsQuery = {
  Response: listPetsQueryResponse
  QueryParams: listPetsQueryParams
}
