export type UpdatePetWithFormPathParamsType = {
  /**
   * @description ID of pet that needs to be updated
   * @type integer, int64
   */
  petId: number
}

export type UpdatePetWithFormQueryParamsType = {
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
export type UpdatePetWithForm405Type = any

export type UpdatePetWithFormMutationResponseType = any

export type UpdatePetWithFormTypeMutation = {
  Response: any
  PathParams: UpdatePetWithFormPathParamsType
  QueryParams: UpdatePetWithFormQueryParamsType
  Errors: UpdatePetWithForm405Type
}
