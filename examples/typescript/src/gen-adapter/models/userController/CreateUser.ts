import type { User } from '../User.ts'

/**
 * @description successful operation
 */
export type CreateUserStatusDefault = User

export type CreateUserData = User

export interface CreateUserRequestConfig {
  data?: CreateUserData
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/user'
}

export interface CreateUserResponses {
  default: CreateUserStatusDefault
}

/**
 * @description Union of all possible responses
 */
export type CreateUserResponse = CreateUserStatusDefault
