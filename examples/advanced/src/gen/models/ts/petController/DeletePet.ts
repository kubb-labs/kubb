export type DeletePetPathParams = {
  /**
   * @description Pet id to delete
   * @type integer
   */
  petId: number
}

export type DeletePetHeaderParams = {
  /**
   * @type string | undefined
   */
  apiKey?: string
}

/**
 * @description Invalid pet value
 */
export type DeletePet400 = any

export type DeletePetMutationResponse = any

export type DeletePetMutation = {
  Response: any
  PathParams: DeletePetPathParams
  HeaderParams: DeletePetHeaderParams
  Errors: DeletePet400
}
