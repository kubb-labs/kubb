export type showPetByIdPathPetId = string

/**
 * @description Expected response to a valid request
 */
export type showPetByIdStatus200 = object

/**
 * @description Unexpected error
 */
export type showPetByIdStatusDefault = object

export type showPetByIdRequestConfig = {
  data?: never
  pathParams: {
    petId: showPetByIdPathPetId
  }
  queryParams?: never
  headerParams?: never
  url: `/pets/${string}`
}

export type showPetByIdResponses = {
  '200': showPetByIdStatus200
  default: showPetByIdStatusDefault
}

/**
 * @description Union of all possible responses
 */
export type showPetByIdResponse = showPetByIdStatus200 | showPetByIdStatusDefault
