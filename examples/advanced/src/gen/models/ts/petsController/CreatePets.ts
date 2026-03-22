import type { PetNotFound } from '../PetNotFound.ts'

export type CreatePetsPathParams = {
  /**
   * @description UUID
   */
  uuid: string
}

export const createPetsQueryParamsBoolParamEnum = {
  true: true,
} as const

export type CreatePetsQueryParamsBoolParamEnumKey = (typeof createPetsQueryParamsBoolParamEnum)[keyof typeof createPetsQueryParamsBoolParamEnum]

export type CreatePetsQueryParams = {
  boolParam?: CreatePetsQueryParamsBoolParamEnumKey
  /**
   * @description Offset *\/
   */
  offset?: number
}

export const createPetsHeaderParamsXEXAMPLEEnum = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
} as const

export type CreatePetsHeaderParamsXEXAMPLEEnumKey = (typeof createPetsHeaderParamsXEXAMPLEEnum)[keyof typeof createPetsHeaderParamsXEXAMPLEEnum]

export type CreatePetsHeaderParams = {
  /**
   * @description Header parameters
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
  name: string
  tag: string
}

export type CreatePetsMutationResponse = CreatePets201

export type CreatePetsMutation = {
  Response: CreatePets201
  Request: CreatePetsMutationRequest
  PathParams: CreatePetsPathParams
  QueryParams: CreatePetsQueryParams
  HeaderParams: CreatePetsHeaderParams
  Errors: CreatePetsError
}
