export type DeleteUserUsername = string | null

export interface DeleteUserData {
  data?: never
  pathParams: {
    username: DeleteUserUsername
  }
  queryParams?: never
  headerParams?: never
  url: `/user/${string}`
}
