import type { User } from '../User.ts'

/**
 * @description Successful operation
 */
export type CreateUsersWithListInputStatus200 = User

export type CreateUsersWithListInputMutationRequest = User[]

export interface CreateUsersWithListInputRequestConfig {
  data?: CreateUsersWithListInputMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/user/createWithList'
}

export interface CreateUsersWithListInputResponses {
  '200': CreateUsersWithListInputStatus200
}

/**
 * @description Union of all possible responses
 */
export type CreateUsersWithListInputResponse = CreateUsersWithListInputStatus200
