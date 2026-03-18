import type { Pet } from '../Pet.ts'

/**
 * @description Successful operation
 */
export type UpdatePet200 = Pet

export type UpdatePetMutationRequest = Pet

export interface UpdatePetData {
  data?: UpdatePetMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/pet'
}

export interface UpdatePetResponses {
  '200': UpdatePet200
}

export type UpdatePetResponse = UpdatePet200
