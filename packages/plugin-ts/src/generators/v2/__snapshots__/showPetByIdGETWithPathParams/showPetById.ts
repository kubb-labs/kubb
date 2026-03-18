export type showPetByIdPetId = string

/**
 * @description Expected response to a valid request
 */
export type showPetById200 = object

/**
 * @description Unexpected error
 */
export type showPetByIdDefault = object

export type showPetByIdData = {
  data?: never
  pathParams: {
    petId: showPetByIdPetId
  }
  queryParams?: never
  headerParams?: never
  url: `/pets/${string}`
}

export type showPetByIdResponses = {
  '200': showPetById200
  default: showPetByIdDefault
}

export type showPetByIdResponse = showPetById200 | showPetByIdDefault
