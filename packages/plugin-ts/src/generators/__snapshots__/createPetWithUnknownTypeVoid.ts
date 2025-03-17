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
 * @description Accepted response
 */
export type CreatePets202 = void

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

export type CreatePetsMutationResponse = createPets201 | createPets202

export type createPetsMutation = {
  Response: createPets201 | createPets202
  Request: createPetsMutationRequest
  Errors: any
}
