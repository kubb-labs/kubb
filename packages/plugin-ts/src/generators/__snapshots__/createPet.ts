/**
 * @description Null response
 */
export type CreatePet = createPet & {
  name?: createPet
}

/**
 * @description unexpected error
 */
export type CreatePet = createPet

export type CreatePet = {
  /**
   * @type string
   */
  name: string
  /**
   * @type string
   */
  tag: string
}

/**
 * @description Null response
 */
export type CreatePet = createPet & {
  name?: createPet
}

export type createPetMutation = {
  Response: createPet
  Request: createPet
}
