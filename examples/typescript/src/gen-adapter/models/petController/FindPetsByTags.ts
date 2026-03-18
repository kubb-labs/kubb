import type { Pet } from '../Pet.ts'

export type FindPetsByTagsQueryTags = string[]

/**
 * @description successful operation
 */
export type FindPetsByTagsStatus200 = Pet[]

export interface FindPetsByTagsRequestConfig {
  data?: never
  pathParams?: never
  queryParams?: {
    tags?: FindPetsByTagsQueryTags
  }
  headerParams?: never
  url: '/pet/findByTags'
}

export interface FindPetsByTagsResponses {
  '200': FindPetsByTagsStatus200
}

/**
 * @description Union of all possible responses
 */
export type FindPetsByTagsResponse = FindPetsByTagsStatus200
