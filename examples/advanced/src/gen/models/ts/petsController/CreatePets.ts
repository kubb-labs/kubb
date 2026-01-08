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

export type CreatePetsQueryParams = {
  /**
   * @type boolean | undefined
   */
  bool_param?: CreatePetsQueryParamsBoolParamEnumKey
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

export type CreatePetsHeaderParams = {
  /**
   * @description Header parameters
   * @type string
   */
  'X-EXAMPLE': CreatePetsHeaderParamsXEXAMPLEEnumKey
}

/**
 * @description Null response
 */
export type CreatePetsStatus201 = any

/**
 * @description unexpected error
 */
export type CreatePetsStatusError = PetNotFound

export type CreatePetsRequestData = {
  /**
   * @type string
   */
  name: string
  /**
   * @type string
   */
  tag: string
}

export type CreatePetsResponses = {
  '201': CreatePetsStatus201
}

export type CreatePetsResponseData = CreatePetsResponses[keyof CreatePetsResponses]
