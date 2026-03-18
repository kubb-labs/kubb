import type { User } from '../User.ts'

export type UpdateUserPathUsername = string

export type UpdateUserData = User

export interface UpdateUserRequestConfig {
  data?: UpdateUserData
  pathParams: {
    username: UpdateUserPathUsername
  }
  queryParams?: never
  headerParams?: never
  url: `/user/${string}`
}
