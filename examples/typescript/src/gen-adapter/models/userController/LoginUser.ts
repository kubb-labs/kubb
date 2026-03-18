export type LoginUserUsername = string

export type LoginUserPassword = string

/**
 * @description successful operation
 */
export type LoginUser200 = string

export interface LoginUserData {
  data?: never
  pathParams?: never
  queryParams?: {
    username?: LoginUserUsername
    password?: LoginUserPassword
  }
  headerParams?: never
  url: '/user/login'
}

export interface LoginUserResponses {
  '200': LoginUser200
}

export type LoginUserResponse = LoginUser200
