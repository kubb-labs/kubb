/**
 * @description Invalid input
 */
export type UpdatePetWithForm405 = any | null

export type UpdatePetWithFormMutationResponse = any | null

export type UpdatePetWithFormPathParams = {
  /**
   * @description ID of pet that needs to be updated
   * @type integer int64
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
export namespace UpdatePetWithFormMutation {
  export type Response = UpdatePetWithFormMutationResponse
  export type PathParams = UpdatePetWithFormPathParams
  export type QueryParams = UpdatePetWithFormQueryParams
  export type Errors = UpdatePetWithForm405
}
