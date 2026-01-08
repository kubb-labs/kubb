import type { Pet } from '../Pet.ts'

/**
 * @description Successful operation
 */
export type UpdatePetStatus200 = Omit<NonNullable<Pet>, 'name'>

/**
 * @description accepted operation
 */
export type UpdatePetStatus202 = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
}

/**
 * @description Invalid ID supplied
 */
export type UpdatePetStatus400 = any

/**
 * @description Pet not found
 */
export type UpdatePetStatus404 = any

/**
 * @description Validation exception
 */
export type UpdatePetStatus405 = any

/**
 * @description Update an existent pet in the store
 */
export type UpdatePetRequestData = Omit<NonNullable<Pet>, 'id'>

export type UpdatePetRequest = {
  data?: UpdatePetRequestData
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/pet'
}

export type UpdatePetResponses = {
  '200': UpdatePetStatus200
  '202': UpdatePetStatus202
}

export type UpdatePetResponseData = UpdatePetResponses[keyof UpdatePetResponses]
