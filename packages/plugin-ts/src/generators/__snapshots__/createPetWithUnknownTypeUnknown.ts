/**
 * @description Null response
 */
export type CreatePets201 = error & {
  /**
   * @type object | undefined
   */
  name?: errorCode
}

/**
 * @description unexpected error
 */
export type CreatePetsError = error

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

export type CreatePetsMutationResponse = createPets201

export type createPetsMutation = {
  Response: createPets201
  Request: createPetsMutationRequest
  Errors: any
}
