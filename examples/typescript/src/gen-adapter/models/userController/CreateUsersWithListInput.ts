import type { User } from '../User.ts'

/**
 * @description Successful operation
 */
export type CreateUsersWithListInput200 = User

export type CreateUsersWithListInputMutationRequest = User[]

export interface CreateUsersWithListInputData {
  data?: CreateUsersWithListInputMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/user/createWithList'
}

export interface CreateUsersWithListInputResponses {
  '200': CreateUsersWithListInput200
}

export type CreateUsersWithListInputResponse = CreateUsersWithListInput200
