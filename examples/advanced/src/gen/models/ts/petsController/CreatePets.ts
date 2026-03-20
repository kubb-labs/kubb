import type { PetNotFound } from '../PetNotFound.ts'

export type CreatePetsPathParams = {
  /**
   * @description UUID
   * @type string
   */
  uuid: string
}

export const createPetsQueryParamsBoolParamEnum = {
  true: true,
} as const

export type CreatePetsQueryParamsBoolParamEnumKey = (typeof createPetsQueryParamsBoolParamEnum)[keyof typeof createPetsQueryParamsBoolParamEnum]

export type CreatePetsQueryParamsBoolParamEnum = CreatePetsQueryParamsBoolParamEnumKey

export type CreatePetsQueryParams = {
  /**
   * @type boolean | undefined
   */
  boolParam?: CreatePetsQueryParamsBoolParamEnumKey
  /**
   * @description Offset *\/
   * @type integer | undefined
   */
  offset?: number
}

export const createPetsHeaderParamsXEXAMPLEEnum = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
} as const

export type CreatePetsHeaderParamsXEXAMPLEEnumKey = (typeof createPetsHeaderParamsXEXAMPLEEnum)[keyof typeof createPetsHeaderParamsXEXAMPLEEnum]

export type CreatePetsHeaderParamsXEXAMPLEEnum = CreatePetsHeaderParamsXEXAMPLEEnumKey

export type CreatePetsHeaderParams = {
  /**
   * @description Header parameters
   * @type string
   */
  xEXAMPLE: CreatePetsHeaderParamsXEXAMPLEEnumKey
}

/**
 * @description Null response
 */
export type CreatePets201 = any

/**
 * @description unexpected error
 */
export type CreatePetsError = PetNotFound

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

export type CreatePetsMutation = {
  Response: CreatePets201
  Request: CreatePetsMutationRequest
  PathParams: CreatePetsPathParams
  HeaderParams: CreatePetsHeaderParams
  Errors: CreatePetsError
}

export type CreatePetsMutationResponse = CreatePets201
