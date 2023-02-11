export type PostPetsPetidRequest = any | null

export type PostPetsPetidResponse = any | null

export type ListPetsParams = {
  /**
   * @type string | undefined
   */
  limit?: string | undefined
}

/**
 * @description A paged array of pets
 */
export type ListPetsResponse = Pets

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
 * @description Expected response to a valid post
 */
export type CreatePetsResponse = Pet

export type ShowPetByIdParams = {
  /**
   * @type string | undefined
   */
  petId?: string | undefined
  /**
   * @type string | undefined
   */
  testId?: string | undefined
}

/**
 * @description Expected response to a valid request
 */
export type ShowPetByIdResponse = Pet

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
