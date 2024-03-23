/**
 * @description Invalid input
 */
export type UpdatePetWithForm405 = any

export type UpdatePetWithFormMutationResponse = any

export type UpdatePetWithFormPathParams = {
  /**
   * @description ID of pet that needs to be updated
   * @type integer | undefined int64
   */
  petId?: number
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
export type UpdatePetWithFormMutation = {
  Response: UpdatePetWithFormMutationResponse
  PathParams: UpdatePetWithFormPathParams
  QueryParams: UpdatePetWithFormQueryParams
  Errors: UpdatePetWithForm405
}
