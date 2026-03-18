import type { Pet } from '../Pet.ts'

export type FindPetsByTagsTags = string[]

/**
 * @description successful operation
 */
export type FindPetsByTags200 = Pet[]

export interface FindPetsByTagsData {
  data?: never
  pathParams?: never
  queryParams?: {
    tags?: FindPetsByTagsTags
  }
  headerParams?: never
  url: '/pet/findByTags'
}

export interface FindPetsByTagsResponses {
  '200': FindPetsByTags200
}

export type FindPetsByTagsResponse = FindPetsByTags200
