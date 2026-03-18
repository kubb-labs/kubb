import type { User } from '../User.ts'

export type GetUserByNameUsername = string

/**
 * @description successful operation
 */
export type GetUserByName200 = User

export interface GetUserByNameData {
  data?: never
  pathParams: {
    username: GetUserByNameUsername
  }
  queryParams?: never
  headerParams?: never
  url: `/user/${string}`
}

export interface GetUserByNameResponses {
  '200': GetUserByName200
}

export type GetUserByNameResponse = GetUserByName200
