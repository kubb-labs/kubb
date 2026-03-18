import type { User } from '../User.ts'

/**
 * @description successful operation
 */
export type CreateUserDefault = User

export type CreateUserMutationRequest = User

export interface CreateUserData {
  data?: CreateUserMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/user'
}

export interface CreateUserResponses {
  default: CreateUserDefault
}

export type CreateUserResponse = CreateUserDefault
