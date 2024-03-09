import type { PetNotFound } from '../PetNotFound'

/**
 * @description Null response
 */
export type CreatePets201 = any

export const CreatePetsHeaderParamsXExampleEnum = {
  'ONE': 'ONE',
  'TWO': 'TWO',
  'THREE': 'THREE',
} as const
export type CreatePetsHeaderParamsXExampleEnum = (typeof CreatePetsHeaderParamsXExampleEnum)[keyof typeof CreatePetsHeaderParamsXExampleEnum]
export type CreatePetsHeaderParams = {
  /**
   * @description Header parameters
   * @type string
   */
  'X-EXAMPLE': CreatePetsHeaderParamsXExampleEnum
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

export type CreatePetsMutationResponse = any

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
export type CreatePetsMutation = {
  Response: CreatePetsMutationResponse
  Request: CreatePetsMutationRequest
  PathParams: CreatePetsPathParams
  QueryParams: CreatePetsQueryParams
  HeaderParams: CreatePetsHeaderParams
}
