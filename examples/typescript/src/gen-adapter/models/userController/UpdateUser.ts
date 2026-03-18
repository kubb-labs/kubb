import type { User } from '../User.ts'

export type UpdateUserUsername = string

export type UpdateUserMutationRequest = User

export interface UpdateUserData {
  data?: UpdateUserMutationRequest
  pathParams: {
    username: UpdateUserUsername
  }
  queryParams?: never
  headerParams?: never
  url: `/user/${string}`
}
