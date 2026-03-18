import type { Pet } from '../Pet.ts'

export type GetPetByIdPetId = number

/**
 * @description successful operation
 */
export type GetPetById200 = Pet

export interface GetPetByIdData {
  data?: never
  pathParams: {
    petId: GetPetByIdPetId
  }
  queryParams?: never
  headerParams?: never
  url: `/pet/${string}`
}

export interface GetPetByIdResponses {
  '200': GetPetById200
}

export type GetPetByIdResponse = GetPetById200
