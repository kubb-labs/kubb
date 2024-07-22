export type UpdatePetWithFormPathParams = {
  /**
   * @description ID of pet that needs to be updated
   * @type integer, int64
   */
  petId: number
}
export type UpdatePetWithFormQueryParams = {
  /**
   * @description Name of pet that needs to be updated
   * @type string | undefined
   */
  name?: string
  /**
   * @description Status of pet that needs to be updated
   * @type string | undefined
   */
  status?: string
}
/**
 * @description Invalid input
 */
export type UpdatePetWithForm405 = any
export type UpdatePetWithFormMutationResponse = any
export type UpdatePetWithFormMutation = {
  Response: UpdatePetWithFormMutationResponse
  PathParams: UpdatePetWithFormPathParams
  QueryParams: UpdatePetWithFormQueryParams
  Errors: UpdatePetWithForm405
}
