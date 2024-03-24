import type { PetNotFound } from '../PetNotFound'

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
}

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

export type CreatePetsMutationResponse = any

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
 * @description Null response
 */
export type CreatePets201 = any

/**
 * @description unexpected error
 */
export type CreatePetsError = PetNotFound

export type CreatePetsMutation = {
  Response: CreatePetsMutationResponse
  Request: CreatePetsMutationRequest
  PathParams: CreatePetsPathParams
  QueryParams: CreatePetsQueryParams
  HeaderParams: CreatePetsHeaderParams
}
