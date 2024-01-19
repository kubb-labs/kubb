import type { PetNotFound } from '../PetNotFound'

/**
 * @description Null response
 */
export type CreatePets201 = any | null

export const CreatePetsHeaderParamsXExample = {
  'ONE': 'ONE',
  'TWO': 'TWO',
  'THREE': 'THREE',
} as const
export type CreatePetsHeaderParamsXExample = (typeof CreatePetsHeaderParamsXExample)[keyof typeof CreatePetsHeaderParamsXExample]
export type CreatePetsHeaderParams = {
  /**
   * @description Header parameters
   * @type string
   */
  'X-EXAMPLE': CreatePetsHeaderParamsXExample
}

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

export type CreatePetsMutationResponse = any | null

export type CreatePetsPathParams = {
  /**
   * @description UUID
   * @type string
   */
  uuid: string
}

export type CreatePetsQueryParams = {
  /**
   * @description Offset
   * @type integer | undefined
   */
  offset?: number
} | undefined

/**
 * @description unexpected error
 */
export type CreatePetsError = PetNotFound
export namespace CreatePetsMutation {
  export type Response = CreatePetsMutationResponse
  export type Request = CreatePetsMutationRequest
  export type PathParams = CreatePetsPathParams
  export type QueryParams = CreatePetsQueryParams
  export type HeaderParams = CreatePetsHeaderParams
  export type Errors = CreatePets201 | CreatePetsError
}
