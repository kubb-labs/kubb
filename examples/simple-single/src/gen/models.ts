export type Error = {
  /**
   * @type integer int32
   */
  code: number
  /**
   * @type string
   */
  message: string
}

export type Person = {
  /**
   * @type integer int64
   */
  id: number
  /**
   * @type string | undefined
   */
  firstName?: string | undefined
  /**
   * @type string | undefined
   */
  lastName?: string | undefined
  /**
   * @type number | undefined
   */
  age?: number | undefined
  /**
   * @type string | undefined
   */
  address?: string | undefined
}

export type Pet = {
  /**
   * @type integer int64
   */
  id: number
  /**
   * @type string
   */
  name: string
  /**
   * @type string | undefined
   */
  tag?: string | undefined
}

export type Pets = Pet[]

export type ListPetsQueryParams = {
  /**
   * @type string | undefined
   */
  limit?: string | undefined
}

/**
 * @description unexpected error
 */
export type ListPetsError = Error

/**
 * @description A paged array of pets
 */
export type ListPetsQueryResponse = Pets

/**
 * @description Null response
 */
export type CreatePets201 = any | null

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

/**
 * @description unexpected error
 */
export type CreatePetsError = Error

/**
 * @description Expected response to a valid post
 */
export type CreatePetsMutationResponse = Pet

export type ShowPetByIdPathParams = {
  /**
   * @type string
   */
  petId: string
  /**
   * @type string
   */
  testId: string
}

/**
 * @description unexpected error
 */
export type ShowPetByIdError = Error

/**
 * @description Expected response to a valid request
 */
export type ShowPetByIdQueryResponse = Pet
