import type { Pet } from '../Pet.ts'
import type { PostPetRequest } from '../PostPetRequest.ts'

/**
 * @description Successful operation
 */
export type AddPetStatus200 = Omit<NonNullable<Pet>, 'name'>

/**
 * @description Pet not found
 */
export type AddPetStatus405 = {
  /**
   * @type integer | undefined, int32
   */
  code?: number
  /**
   * @type string | undefined
   */
  message?: string
}

/**
 * @description Create a new pet in the store
 */
export type AddPetRequestData = PostPetRequest

export type AddPetRequest = {
  data?: AddPetRequestData
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/pet'
}

export type AddPetResponses = {
  '200': AddPetStatus200
}

export type AddPetResponseData = AddPetResponses[keyof AddPetResponses]
