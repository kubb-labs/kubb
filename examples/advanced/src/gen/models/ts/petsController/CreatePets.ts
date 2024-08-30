import type { PetNotFound } from '../PetNotFound.ts'

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

export const createPetsHeaderParamsXExampleEnum = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
} as const

export type CreatePetsHeaderParamsXExampleEnum = (typeof createPetsHeaderParamsXExampleEnum)[keyof typeof createPetsHeaderParamsXExampleEnum]

export type CreatePetsHeaderParams = {
  /**
   * @description Header parameters
   * @type string
   */
  'X-EXAMPLE': CreatePetsHeaderParamsXExampleEnum
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

export type CreatePetsMutationResponse = any

export type CreatePetsMutation = {
  Response: CreatePetsMutationResponse
  Request: CreatePetsMutationRequest
  PathParams: CreatePetsPathParams
  QueryParams: CreatePetsQueryParams
  HeaderParams: CreatePetsHeaderParams
}
