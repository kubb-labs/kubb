import type { Pet } from '../Pet.ts'

/**
 * @description Successful operation
 */
export type UpdatePetStatus200 = Pet

export type UpdatePetMutationRequest = Pet

export interface UpdatePetRequestConfig {
  data?: UpdatePetMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/pet'
}

export interface UpdatePetResponses {
  '200': UpdatePetStatus200
}

/**
 * @description Union of all possible responses
 */
export type UpdatePetResponse = UpdatePetStatus200
