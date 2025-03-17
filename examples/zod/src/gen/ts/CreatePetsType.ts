import type { PetNotFoundType } from './PetNotFoundType.ts'

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

export const createPetsHeaderParamsXEXAMPLEEnum = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
} as const

export type CreatePetsHeaderParamsXEXAMPLEEnumType = (typeof createPetsHeaderParamsXEXAMPLEEnum)[keyof typeof createPetsHeaderParamsXEXAMPLEEnum]

export type CreatePetsHeaderParamsType = {
  /**
   * @description Header parameters
   * @type string
   */
  'X-EXAMPLE': CreatePetsHeaderParamsXEXAMPLEEnumType
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

export type CreatePetsMutationResponseType = CreatePets201Type

export type CreatePetsTypeMutation = {
  Response: CreatePets201Type
  Request: CreatePetsMutationRequestType
  PathParams: CreatePetsPathParamsType
  QueryParams: CreatePetsQueryParamsType
  HeaderParams: CreatePetsHeaderParamsType
  Errors: any
}
