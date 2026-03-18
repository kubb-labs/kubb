import type { User } from '../User.ts'

export type UpdateUserPathUsername = string

export type UpdateUserMutationRequest = User

export interface UpdateUserRequestConfig {
  data?: UpdateUserMutationRequest
  pathParams: {
    username: UpdateUserPathUsername
  }
  queryParams?: never
  headerParams?: never
  url: `/user/${string}`
}
