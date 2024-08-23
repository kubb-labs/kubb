/**
 * @description Null response
 */
export type CreatePets201 = any
/**
 * @description unexpected error
 */
export type CreatePetsError = Error
export type CreatePetsMutationRequest = {
  /**
   * @type string
   */
  name: string
  /**
   * @type string
   */
  tag: string
}
export type CreatePetsMutationResponse = any
export type CreatePetsMutation = {
  Response: CreatePetsMutationResponse
  Request: CreatePetsMutationRequest
}
