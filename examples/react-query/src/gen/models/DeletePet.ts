// version: 1.0.11

/**
 * @type object
 */
export type DeletePetPathParams = {
  /**
   * @description Pet id to delete
   * @type integer
   */
  pet_id: number
}

/**
 * @type object
 */
export type DeletePetHeaderParams = {
  /**
   * @type string | undefined
   */
  api_key?: string
}

/**
 * @description Invalid pet value
 * @type any
 */
export type DeletePet400 = any

export type DeletePetMutationResponse = any

/**
 * @type object
 */
export type DeletePetMutation = {
  Response: any
  PathParams: DeletePetPathParams
  HeaderParams: DeletePetHeaderParams
  Errors: DeletePet400
}
