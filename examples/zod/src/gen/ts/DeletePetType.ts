export type DeletePetPathParamsType = {
  /**
   * @description Pet id to delete
   * @type integer, int64
   */
  petId: number
}
export type DeletePetHeaderParamsType = {
  /**
   * @type string | undefined
   */
  api_key?: string
}
/**
 * @description Invalid pet value
 */
export type DeletePet400Type = any
export type DeletePetMutationResponseType = any
export type DeletePetTypeMutation = {
  Response: DeletePetMutationResponseType
  PathParams: DeletePetPathParamsType
  HeaderParams: DeletePetHeaderParamsType
  Errors: DeletePet400Type
}
