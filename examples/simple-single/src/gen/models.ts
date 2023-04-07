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
 * @description A paged array of pets
 */
export type ListPetsResponse = Pets

/**
 * @description unexpected error
 */
export type ListPetsError = Error

export type CreatePetsRequest = {
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
export type CreatePets201 = any | null

/**
 * @description Expected response to a valid post
 */
export type CreatePetsResponse = Pet

/**
 * @description unexpected error
 */
export type CreatePetsError = Error

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
 * @description Expected response to a valid request
 */
export type ShowPetByIdResponse = Pet

/**
 * @description unexpected error
 */
export type ShowPetByIdError = Error
