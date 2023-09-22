import type { PetNotFound } from '../PetNotFound'

/**
 * CreatePets201
 * CreatePets201
 * @description Null response
 */
export type CreatePets201 = any | null

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

export const CreatepetsheaderparamsXexample = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
} as const
export type CreatepetsheaderparamsXexample = (typeof CreatepetsheaderparamsXexample)[keyof typeof CreatepetsheaderparamsXexample]
export type CreatepetsHeaderparams = {
  /**
   * @description Header parameters
   * @type string
   */
  'X-EXAMPLE': CreatepetsheaderparamsXexample
}

export type CreatepetsQueryparams = {
  /**
   * @description Offset
   * @type integer | undefined
   */
  offset?: number
}

/**
 * CreatePetserror
 * CreatePetserror
 * @description unexpected error
 */
export type CreatePetserror = PetNotFound
