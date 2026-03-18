import type { AddPetRequest } from '../AddPetRequest.ts'
import type { Pet } from '../Pet.ts'

/**
 * @description Successful operation
 */
export type AddPetStatus200 = Pet

/**
 * @description Pet not found
 */
export interface AddPetStatus405 {
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

export interface AddPetRequestConfig {
  data?: AddPetMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/pet'
}

export interface AddPetResponses {
  '200': AddPetStatus200
  '405': AddPetStatus405
}

/**
 * @description Union of all possible responses
 */
export type AddPetResponse = AddPetStatus200 | AddPetStatus405
