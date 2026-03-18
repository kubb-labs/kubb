export type DeleteUserPathUsername = string | null

export interface DeleteUserRequestConfig {
  data?: never
  pathParams: {
    username: DeleteUserPathUsername
  }
  queryParams?: never
  headerParams?: never
  url: `/user/${string}`
}
