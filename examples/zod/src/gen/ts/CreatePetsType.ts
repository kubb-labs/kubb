import type { PetNotFoundType } from './PetNotFoundType'

export type CreatePetsPathParamsType = {
  /**
   * @description UUID
   * @type string
   */
  uuid: string
}

export type CreatePetsQueryParamsType = {
  /**
   * @description Offset
   * @type integer | undefined
   */
  offset?: number
}

export const createPetsHeaderParamsXExample = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
} as const

export type CreatePetsHeaderParamsXExampleType = (typeof createPetsHeaderParamsXExample)[keyof typeof createPetsHeaderParamsXExample]

export type CreatePetsHeaderParamsType = {
  /**
   * @description Header parameters
   * @type string
   */
  'X-EXAMPLE': CreatePetsHeaderParamsXExampleType
}

/**
 * @description Null response
 */
export type CreatePets201Type = any

/**
 * @description unexpected error
 */
export type CreatePetsErrorType = PetNotFoundType

export type CreatePetsMutationRequestType = {
  /**
   * @type string
   */
  name: string
  /**
   * @type string
   */
  tag: string
}

export type CreatePetsMutationResponseType = any

export type CreatePetsTypeMutation = {
  Response: CreatePetsMutationResponseType
  Request: CreatePetsMutationRequestType
  PathParams: CreatePetsPathParamsType
  QueryParams: CreatePetsQueryParamsType
  HeaderParams: CreatePetsHeaderParamsType
}
