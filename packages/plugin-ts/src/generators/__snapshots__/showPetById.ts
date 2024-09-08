export type ShowPetByIdPathParams = {
  /**
   * @description The id of the pet to retrieve
   * @type string
   */
  petId: string
  /**
   * @description The id of the pet to retrieve
   * @type string
   */
  testId: string
}

/**
 * @description Expected response to a valid request
 */
export type ShowPetById200 = pet

/**
 * @description unexpected error
 */
export type ShowPetByIdError = error

/**
 * @description Expected response to a valid request
 */
export type ShowPetByIdQueryResponse = pet

export type showPetByIdQuery = {
  Response: showPetByIdQueryResponse
  PathParams: showPetByIdPathParams
}
