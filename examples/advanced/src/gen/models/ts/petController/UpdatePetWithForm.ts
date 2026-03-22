export type UpdatePetWithFormPathParams = {
  /**
   * @description ID of pet that needs to be updated
   */
  petId: number
}

export type UpdatePetWithFormQueryParams = {
  /**
   * @description Name of pet that needs to be updated
   */
  name?: string
  /**
   * @description Status of pet that needs to be updated
   */
  status?: string
}

/**
 * @description Invalid input
 */
export type UpdatePetWithForm405 = any

export type UpdatePetWithFormMutationResponse = any

export type UpdatePetWithFormMutation = {
  Response: any
  PathParams: UpdatePetWithFormPathParams
  QueryParams: UpdatePetWithFormQueryParams
  Errors: UpdatePetWithForm405
}
