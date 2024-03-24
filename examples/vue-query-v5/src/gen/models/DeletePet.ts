export type DeletePetPathParams = {
  /**
   * @description Pet id to delete
   * @type integer int64
   */
  petId: number
}

export type DeletePetHeaderParams = {
  /**
   * @type string | undefined
   */
  api_key?: string
}

export type DeletePetMutationResponse = any

/**
 * @description Invalid pet value
 */
export type DeletePet400 = any

export type DeletePetMutation = {
  Response: DeletePetMutationResponse
  PathParams: DeletePetPathParams
  HeaderParams: DeletePetHeaderParams
  Errors: DeletePet400
}
