import type { PetNotFound } from '../PetNotFound.ts'

/**
 * @type object
 */
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

/**
 * @type object
 */
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

/**
 * @type object
 */
export type CreatePetsHeaderParams = {
  /**
   * @description Header parameters
   * @type string
   */
  xEXAMPLE: CreatePetsHeaderParamsXEXAMPLEEnumKey
}

/**
 * @description Null response
 * @type any
 */
export type CreatePets201 = any

/**
 * @description unexpected error
 * @type any
 */
export type CreatePetsError = PetNotFound

/**
 * @type object
 */
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

export type CreatePetsMutationResponse = CreatePets201

/**
 * @type object
 */
export type CreatePetsMutation = {
  Response: CreatePets201
  Request: CreatePetsMutationRequest
  QueryParams: CreatePetsQueryParams
  PathParams: CreatePetsPathParams
  HeaderParams: CreatePetsHeaderParams
  Errors: CreatePetsError
}
