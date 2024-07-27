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
export type ShowPetById200 = Pet
/**
 * @description unexpected error
 */
export type ShowPetByIdError = Error
/**
 * @description Expected response to a valid request
 */
export type ShowPetByIdQueryResponse = Pet
export type ShowPetByIdQuery = {
  Response: ShowPetByIdQueryResponse
  PathParams: ShowPetByIdPathParams
}
