import type { AddPetRequest } from '../AddPetRequest.ts'
import type { Pet } from '../Pet.ts'

/**
 * @description Successful operation
 */
export type AddPet200 = Pet

/**
 * @description Pet not found
 */
export interface AddPet405 {
  /**
   * @type integer | undefined
   */
  code?: number
  /**
   * @type string | undefined
   */
  message?: string
}

export type AddPetMutationRequest = AddPetRequest

export interface AddPetData {
  data?: AddPetMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/pet'
}

export interface AddPetResponses {
  '200': AddPet200
  '405': AddPet405
}

export type AddPetResponse = AddPet200 | AddPet405
