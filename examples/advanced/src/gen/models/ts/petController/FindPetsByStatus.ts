import type { Pet } from '../Pet.ts'

export type FindPetsByStatusPathParams = {
  /**
   * @type string
   */
  step_id: string
}

/**
 * @description successful operation
 */
export type FindPetsByStatusStatus200 = Pet[]

/**
 * @description Invalid status value
 */
export type FindPetsByStatusStatus400 = any

export type FindPetsByStatusRequest = {
  data?: never
  pathParams: FindPetsByStatusPathParams
  queryParams?: never
  headerParams?: never
  url: `/pet/findByStatus/${string}`
}

export type FindPetsByStatusResponses = {
  '200': FindPetsByStatusStatus200
}

export type FindPetsByStatusResponseData = FindPetsByStatusResponses[keyof FindPetsByStatusResponses]
