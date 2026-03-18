export type createPetsName = number

/**
 * @description Null response
 */
export type createPets201 = object

/**
 * @description Unexpected error
 */
export type createPetsDefault = object

export type createPetsData = {
  data?: never
  pathParams: {
    fullName?: string
  }
  queryParams?: never
  headerParams?: never
  url: '/pets'
}

export type createPetsResponses = {
  '201': createPets201
  default: createPetsDefault
}

export type createPetsResponse = createPets201 | createPetsDefault
